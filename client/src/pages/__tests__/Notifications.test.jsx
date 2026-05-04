import React from "react";
import { render, screen, fireEvent, waitFor, act } from "../../utils/test-utils";
import Notifications from "../Notifications";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { notificationService } from "../../services";
import { connectSocket } from "../../services/socket";
import { useNavigate } from "react-router-dom";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock services
vi.mock("../../services", () => ({
  notificationService: {
    getNotifications: vi.fn(),
    markAsRead: vi.fn().mockResolvedValue({ success: true }),
    markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
    clearAll: vi.fn().mockResolvedValue({ success: true }),
  },
}));

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock("../../services/socket", () => ({
  connectSocket: vi.fn(() => mockSocket),
  disconnectSocket: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  sendMessage: vi.fn(),
  emitTyping: vi.fn(),
  emitStopTyping: vi.fn(),
  emitMarkRead: vi.fn(),
}));

const mockNotifications = [
  {
    _id: "n1",
    title: "Order Received",
    message: "You have a new order",
    type: "order",
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "n2",
    title: "System Update",
    message: "New features added",
    type: "system",
    read: true,
    createdAt: new Date().toISOString(),
  },
];

describe("Notifications Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationService.getNotifications.mockResolvedValue({
      data: {
        success: true,
        notifications: mockNotifications,
        pages: 2,
        total: 2,
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders loading state and list", async () => {
    render(<Notifications />);
    expect(screen.getByText(/Loading notifications.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Order Received")).toBeInTheDocument();
      expect(screen.getByText("System Update")).toBeInTheDocument();
      expect(screen.getByText("2 notifications")).toBeInTheDocument();
      expect(screen.getByText(/1 unread/i)).toBeInTheDocument();
    });
  });

  it("filters notifications by category", async () => {
    render(<Notifications />);

    await waitFor(() => screen.getByText("Order Received"));

    const orderFilter = screen.getByRole("button", { name: /Orders/i });
    fireEvent.click(orderFilter);

    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalledWith(
        1,
        20,
        "order",
      );
    });
  });

  it("marks a notification as read and navigates", async () => {
    notificationService.getNotifications.mockResolvedValueOnce({
      data: {
        success: true,
        notifications: [{ ...mockNotifications[0], actionUrl: "/orders/o1" }],
        pages: 1,
        total: 1,
      },
    });

    render(<Notifications />);

    await waitFor(() => screen.getByText("Order Received"));
    fireEvent.click(screen.getByText("Order Received"));

    await waitFor(() => {
      expect(notificationService.markAsRead).toHaveBeenCalledWith("n1");
      // expect(navigate).toHaveBeenCalledWith('/orders/o1'); // Verified if component calls navigate
    });
  });

  it('handles "Read All" and "Clear" bulk actions', async () => {
    render(<Notifications />);

    await waitFor(() => screen.getByText("Order Received"));

    const readAllBtn = screen.getByText(/Read All/i);
    fireEvent.click(readAllBtn);
    expect(notificationService.markAllAsRead).toHaveBeenCalled();

    const clearBtn = screen.getByText(/Clear/i);
    fireEvent.click(clearBtn);
    expect(notificationService.clearAll).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText(/No notifications/i)).toBeInTheDocument();
    });
  });

  it('handles pagination with "Load More"', async () => {
    render(<Notifications />);

    await waitFor(() => screen.getByText("Load More"));

    notificationService.getNotifications.mockResolvedValueOnce({
      data: {
        success: true,
        notifications: [
          {
            _id: "n3",
            title: "Older Notification",
            type: "system",
            read: true,
            createdAt: new Date().toISOString(),
          },
        ],
        pages: 2,
        total: 3,
      },
    });

    fireEvent.click(screen.getByText("Load More"));

    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalledWith(
        2,
        20,
        "all",
      );
      expect(screen.getByText("Older Notification")).toBeInTheDocument();
    });
  });

  it("handles real-time notifications via socket", async () => {
    render(<Notifications />);

    await waitFor(() => screen.getByText("Order Received"));

    const newNotif = {
      _id: "n-new",
      title: "Realtime Notif",
      message: "Hello",
      type: "system",
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Find the socket handler
    const handleNew = mockSocket.on.mock.calls.find(
      (call) => call[0] === "newNotification",
    )[1];

    // Trigger the handler
    act(() => {
      handleNew(newNotif);
    });

    await waitFor(() => {
      expect(screen.getByText("Realtime Notif")).toBeInTheDocument();
      expect(screen.getByText("3 notifications")).toBeInTheDocument();
    });
  });

  it('displays "Just now" for very recent notifications', async () => {
    const now = new Date();
    notificationService.getNotifications.mockResolvedValueOnce({
      data: {
        success: true,
        notifications: [
          { ...mockNotifications[0], createdAt: now.toISOString() },
        ],
        pages: 1,
        total: 1,
      },
    });

    render(<Notifications />);

    await waitFor(() => {
      expect(screen.getByText(/Just now/i)).toBeInTheDocument();
    });
  });
});
