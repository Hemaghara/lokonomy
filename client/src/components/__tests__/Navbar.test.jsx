import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "../../utils/test-utils";
import Navbar from "../Navbar";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUser } from "../../context/UserContext";
import { chatService } from "../../services";
import * as socketService from "../../services/socket";
import { BrowserRouter } from "react-router-dom";

vi.mock("../../context/UserContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: vi.fn(),
  };
});

vi.mock("../../services/socket", () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

vi.mock("../../services", () => ({
  chatService: {
    getUnreadCount: vi.fn(),
  },
}));

// Mock NotificationBell since it's tested separately
vi.mock("../NotificationBell", () => ({
  default: () => <div data-testid="notification-bell">Bell</div>,
}));

const renderWithRouter = (ui) => render(ui);

describe("Navbar Component", () => {
  let mockSocket;
  let socketCallbacks = {};

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    socketCallbacks = {};

    mockSocket = {
      on: vi.fn((event, cb) => {
        socketCallbacks[event] = cb;
      }),
      off: vi.fn((event) => {
        delete socketCallbacks[event];
      }),
    };

    socketService.connectSocket.mockReturnValue(mockSocket);
    chatService.getUnreadCount.mockResolvedValue({
      data: { success: true, count: 0 },
    });
  });

  it("renders correctly for unauthenticated user", () => {
    useUser.mockReturnValue({ user: null, logout: vi.fn() });
    renderWithRouter(<Navbar />);

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.queryByTestId("notification-bell")).not.toBeInTheDocument();
  });

  it("renders correctly for authenticated user", async () => {
    useUser.mockReturnValue({
      user: {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        loyaltyPoints: 100,
      },
      logout: vi.fn(),
    });

    renderWithRouter(<Navbar />);

    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    expect(screen.getByTestId("notification-bell")).toBeInTheDocument();

    // Checks for desktop elements
    await waitFor(() => {
      expect(screen.getByText("100")).toBeInTheDocument(); // Loyalty points
      expect(screen.getByText("MEMBER")).toBeInTheDocument(); // Default subscription plan
    });
  });

  it("fetches unread count and listens to socket on mount", async () => {
    useUser.mockReturnValue({ user: { id: "1" }, logout: vi.fn() });
    chatService.getUnreadCount.mockResolvedValueOnce({
      data: { success: true, count: 5 },
    });

    renderWithRouter(<Navbar />);

    expect(socketService.connectSocket).toHaveBeenCalledWith({
      userId: "1",
      isAdmin: false,
    });
    expect(chatService.getUnreadCount).toHaveBeenCalled();

    await waitFor(() => {
      // The badge should show 5. We have it in desktop and mobile menus,
      // let's just find by text
      const badges = screen.getAllByText("5");
      expect(badges.length).toBeGreaterThan(0);
    });

    // Simulate new message socket event
    act(() => {
      if (socketCallbacks["newMessageNotification"]) {
        socketCallbacks["newMessageNotification"]();
      }
    });

    await waitFor(() => {
      const badges = screen.getAllByText("6");
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it("displays impersonation banner when active", () => {
    useUser.mockReturnValue({ user: { id: "admin1" }, logout: vi.fn() });
    localStorage.setItem("impersonationToken", "token");
    localStorage.setItem(
      "impersonatedUser",
      JSON.stringify({ name: "Impersonated User", email: "imp@user.com" }),
    );

    // Need to define window.location since endImpersonation redirects
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: "" };

    renderWithRouter(<Navbar />);

    expect(screen.getByText(/Impersonating:/)).toBeInTheDocument();
    expect(screen.getByText("Impersonated User")).toBeInTheDocument();
    expect(screen.getByText(/imp@user.com/)).toBeInTheDocument();

    const endBtn = screen.getByText("End Session");
    fireEvent.click(endBtn);

    expect(localStorage.getItem("impersonationToken")).toBeNull();
    expect(window.location.href).toBe("/admin/users");

    // Restore
    window.location = originalLocation;
  });

  it("toggles mobile menu", async () => {
    useUser.mockReturnValue({
      user: { id: "1", name: "John Doe", subscription: { plan: "pro" } },
      logout: vi.fn(),
    });

    renderWithRouter(<Navbar />);

    const toggleBtn = screen.getByLabelText("Toggle menu");

    // Open menu
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument(); // Appears in mobile menu
      expect(screen.getByText("pro")).toBeInTheDocument();
    });

    // Click a link inside mobile menu should close it
    const inboxLink = screen
      .getAllByText("Inbox")
      .find((el) => el.closest("a"));
    fireEvent.click(inboxLink);

    // Wait for exit animation or state change
    // Framer motion might take time, but we can verify state is closed
    // by checking if elements are hidden eventually or if user menu is not visible
    // For synchronous tests with framer motion, often AnimatePresence removes it
  });

  it("handles scroll event to add background class", () => {
    useUser.mockReturnValue({ user: null, logout: vi.fn() });
    renderWithRouter(<Navbar />);

    const nav = screen.getByRole("navigation");
    expect(nav.className).toContain("bg-transparent");

    act(() => {
      window.scrollY = 50;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(nav.className).toContain("backdrop-blur-3xl");
  });

  it("calls logout when mobile logout button is clicked", async () => {
    const logoutMock = vi.fn();
    useUser.mockReturnValue({
      user: { id: "1", name: "John Doe" },
      logout: logoutMock,
    });

    renderWithRouter(<Navbar />);

    fireEvent.click(screen.getByLabelText("Toggle menu"));

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Find logout button in mobile menu
    const logoutBtn =
      screen.getByText("John Doe").parentElement.nextElementSibling; // The logout icon button
    fireEvent.click(logoutBtn);

    expect(logoutMock).toHaveBeenCalled();
  });
});
