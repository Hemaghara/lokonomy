import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "../../../utils/test-utils";
import AdminNotificationBell from "../../admin/AdminNotificationBell";
import { notificationService } from "../../../services";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../../services", () => ({
  notificationService: {
    getUnreadCount: vi.fn(),
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearAll: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AdminNotificationBell Component", () => {
  const mockAdminInfo = { id: "admin123", name: "Admin User" };
  const mockNotifications = [
    {
      _id: "n1",
      title: "New Order",
      message: "You have a new order",
      type: "order",
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: "/admin/orders",
    },
    {
      _id: "n2",
      title: "System Update",
      message: "System updated successfully",
      type: "system",
      read: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    }, // 1h ago
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("adminInfo", JSON.stringify(mockAdminInfo));
    notificationService.getUnreadCount.mockResolvedValue({
      data: { success: true, count: 5 },
    });
    notificationService.getNotifications.mockResolvedValue({
      data: { success: true, notifications: mockNotifications },
    });
    notificationService.markAsRead.mockResolvedValue({
      data: { success: true },
    });
    notificationService.markAllAsRead.mockResolvedValue({
      data: { success: true },
    });
    notificationService.clearAll.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
  });

  it("fetches unread count on mount", async () => {
    await act(async () => {
      render(<AdminNotificationBell />);
    });
    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  it("shows 99+ if unread count is greater than 99", async () => {
    notificationService.getUnreadCount.mockResolvedValue({
      data: { success: true, count: 105 },
    });
    await act(async () => {
      render(<AdminNotificationBell />);
    });
    await waitFor(() => {
      expect(screen.getByText("99+")).toBeInTheDocument();
    });
  });

  it("toggles dropdown and fetches notifications", async () => {
    await act(async () => {
      render(<AdminNotificationBell />);
    });

    const bellButton = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(bellButton);
    });

    await waitFor(() => {
      expect(screen.getByText("New Order")).toBeInTheDocument();
      expect(screen.getByText("1h ago")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(bellButton);
    });
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", async () => {
    await act(async () => {
      render(<AdminNotificationBell />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() =>
      expect(screen.getByText("Notifications")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.mouseDown(document.body);
    });

    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });

  it("marks a notification as read on click and navigates", async () => {
    await act(async () => {
      render(<AdminNotificationBell />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => screen.getByText("New Order"));

    await act(async () => {
      fireEvent.click(screen.getByText("New Order"));
    });

    expect(notificationService.markAsRead).toHaveBeenCalledWith("n1");
    expect(mockNavigate).toHaveBeenCalledWith("/admin/orders");
  });

  it("navigates to push manager when clicking view push manager button", async () => {
    await act(async () => {
      render(<AdminNotificationBell />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => screen.getByText("View Push Manager"));

    await act(async () => {
      fireEvent.click(screen.getByText("View Push Manager"));
    });

    expect(mockNavigate).toHaveBeenCalledWith("/admin/notifications");
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });

  it("marks all as read", async () => {
    await act(async () => {
      render(<AdminNotificationBell />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => screen.getByTitle("Mark all as read"));

    await act(async () => {
      fireEvent.click(screen.getByTitle("Mark all as read"));
    });
    expect(notificationService.markAllAsRead).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText(/5 New/i)).not.toBeInTheDocument();
    });
  });

  it("clears all notifications", async () => {
    await act(async () => {
      render(<AdminNotificationBell />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => screen.getByTitle("Clear all"));

    await act(async () => {
      fireEvent.click(screen.getByTitle("Clear all"));
    });
    expect(notificationService.clearAll).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText("All caught up!")).toBeInTheDocument();
    });
  });

  it("handles API failure for unread count gracefully", async () => {
    notificationService.getUnreadCount.mockRejectedValue(
      new Error("API Error"),
    );
    await act(async () => {
      render(<AdminNotificationBell />);
    });
    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("shows loading state while fetching notifications", async () => {
    notificationService.getNotifications.mockReturnValue(new Promise(() => {})); // Never resolves
    await act(async () => {
      render(<AdminNotificationBell />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
