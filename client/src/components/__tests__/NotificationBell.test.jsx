import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "../../utils/test-utils";
import NotificationBell from "../NotificationBell";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useUser } from "../../context/UserContext";
import { notificationService } from "../../services";
import * as socketService from "../../services/socket";

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
  notificationService: {
    getUnreadCount: vi.fn(),
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearAll: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (ui) => render(ui);

describe("NotificationBell Component", () => {
  let mockSocket;
  let socketCallbacks = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
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
    notificationService.getUnreadCount.mockResolvedValue({
      data: { success: true, count: 0 },
    });
    notificationService.getNotifications.mockResolvedValue({
      data: { success: true, notifications: [] },
    });
  });

  it("renders bell and fetches unread count on mount", async () => {
    useUser.mockReturnValue({ user: { id: "1" } });
    notificationService.getUnreadCount.mockResolvedValueOnce({
      data: { success: true, count: 3 },
    });

    renderWithRouter(<NotificationBell />);

    expect(notificationService.getUnreadCount).toHaveBeenCalled();
    expect(socketService.connectSocket).toHaveBeenCalledWith("1");

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument(); // Badge
    });
  });

  it("shows 99+ if count > 99", async () => {
    useUser.mockReturnValue({ user: { id: "1" } });
    notificationService.getUnreadCount.mockResolvedValueOnce({
      data: { success: true, count: 150 },
    });

    renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText("99+")).toBeInTheDocument();
    });
  });

  it("opens dropdown and fetches notifications on click", async () => {
    useUser.mockReturnValue({ user: { id: "1" } });
    const mockNotifs = [
      {
        _id: "n1",
        title: "New Order",
        message: "You have a new order",
        type: "order",
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];
    notificationService.getNotifications.mockResolvedValueOnce({
      data: { success: true, notifications: mockNotifs },
    });

    renderWithRouter(<NotificationBell />);

    const bellBtn = screen.getByRole("button", { name: "Notifications" });
    fireEvent.click(bellBtn);

    expect(notificationService.getNotifications).toHaveBeenCalledWith(1, 15);

    await waitFor(() => {
      expect(screen.getByText("Notifications")).toBeInTheDocument();
      expect(screen.getByText("New Order")).toBeInTheDocument();
      expect(screen.getByText("You have a new order")).toBeInTheDocument();
    });
  });

  it("handles socket newNotification", async () => {
    useUser.mockReturnValue({ user: { id: "1" } });
    notificationService.getUnreadCount.mockResolvedValueOnce({
      data: { success: true, count: 0 },
    });

    renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      expect(socketCallbacks["newNotification"]).toBeDefined();
    });

    // Open dropdown first so socket notification is visible and not overwritten by fetch
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    await waitFor(() => {
      expect(screen.getByText("Notifications")).toBeInTheDocument();
    });

    act(() => {
      socketCallbacks["newNotification"]({
        _id: "n2",
        title: "Socket Notif",
        message: "From socket",
        type: "system",
        read: false,
        createdAt: new Date().toISOString(),
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Socket Notif")).toBeInTheDocument();
    });
  });

  it("marks notification as read", async () => {
    useUser.mockReturnValue({ user: { id: "1" } });
    const mockNotifs = [
      {
        _id: "n1",
        title: "Unread Alert",
        type: "system",
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];
    notificationService.getNotifications.mockResolvedValueOnce({
      data: { success: true, notifications: mockNotifs },
    });
    notificationService.getUnreadCount.mockResolvedValueOnce({
      data: { success: true, count: 1 },
    });
    notificationService.markAsRead.mockResolvedValueOnce({});

    renderWithRouter(<NotificationBell />);

    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));

    await waitFor(() => {
      expect(screen.getByText("Unread Alert")).toBeInTheDocument();
    });

    // The Mark as read button
    const markReadBtn = screen.getByTitle("Mark as read");
    fireEvent.click(markReadBtn);

    expect(notificationService.markAsRead).toHaveBeenCalledWith("n1");

    await waitFor(() => {
      expect(screen.queryByTitle("Mark as read")).not.toBeInTheDocument(); // The button should disappear once read
    });
  });

  it("navigates when notification is clicked", async () => {
    useUser.mockReturnValue({ user: { id: "1" } });
    const mockNotifs = [
      {
        _id: "n1",
        title: "Clickable",
        actionUrl: "/some-path",
        type: "system",
        read: true,
        createdAt: new Date().toISOString(),
      },
    ];
    notificationService.getNotifications.mockResolvedValueOnce({
      data: { success: true, notifications: mockNotifs },
    });

    renderWithRouter(<NotificationBell />);

    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));

    await waitFor(() => {
      expect(screen.getByText("Clickable")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Clickable"));

    expect(mockNavigate).toHaveBeenCalledWith("/some-path");
  });

  it("marks all as read", async () => {
    useUser.mockReturnValue({ user: { id: "1" } });
    notificationService.getUnreadCount.mockResolvedValueOnce({
      data: { success: true, count: 2 },
    });

    renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));

    await waitFor(() => {
      expect(screen.getByTitle("Mark all as read")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Mark all as read"));

    expect(notificationService.markAllAsRead).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.queryByTitle("Mark all as read")).not.toBeInTheDocument(); // Should disappear
      expect(screen.queryByText("2")).not.toBeInTheDocument(); // Badge should disappear
    });
  });

  it("clears all notifications", async () => {
    useUser.mockReturnValue({ user: { id: "1" } });
    const mockNotifs = [
      {
        _id: "n1",
        title: "Some alert",
        type: "system",
        read: true,
        createdAt: new Date().toISOString(),
      },
    ];
    notificationService.getNotifications.mockResolvedValueOnce({
      data: { success: true, notifications: mockNotifs },
    });

    renderWithRouter(<NotificationBell />);

    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));

    await waitFor(() => {
      expect(screen.getByTitle("Clear all")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Clear all"));

    expect(notificationService.clearAll).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText("All caught up!")).toBeInTheDocument();
    });
  });

  it("closes dropdown when clicking outside", async () => {
    useUser.mockReturnValue({ user: { id: "1" } });
    renderWithRouter(
      <div>
        <div data-testid="outside">Outside</div>
        <NotificationBell />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));

    await waitFor(() => {
      expect(screen.getByText("Notifications")).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByTestId("outside"));

    await waitFor(() => {
      expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
    });
  });
});
