import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "../../../utils/test-utils";
import AdminPushNotifications from "../../admin/AdminPushNotifications";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../services", () => ({
  adminService: {
    getNotificationHistory: vi.fn(),
    getScheduledNotifications: vi.fn(),
    sendGlobalNotification: vi.fn(),
    sendPlanNotification: vi.fn(),
    scheduleNotification: vi.fn(),
    cancelScheduledNotification: vi.fn(),
  },
}));

describe("AdminPushNotifications Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockImplementation(() => true);

    adminService.getNotificationHistory.mockResolvedValue({
      data: [
        {
          title: "Past Alert",
          message: "Hello all",
          targetPlan: "All Users",
          recipientCount: 100,
          sentAt: new Date().toISOString(),
        },
        {
          title: "Plan Alert",
          message: "Hello gold",
          targetPlan: "gold",
          recipientCount: 50,
          sentAt: new Date().toISOString(),
        },
      ],
    });

    adminService.getScheduledNotifications.mockResolvedValue({
      data: [
        {
          _id: "s1",
          title: "Scheduled Alert",
          message: "Coming soon",
          target: "all",
          scheduledFor: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          _id: "s2",
          title: "Scheduled Plan",
          message: "Coming soon plan",
          target: "plan",
          targetPlan: "gold",
          scheduledFor: new Date(Date.now() + 86400000).toISOString(),
        },
      ],
    });

    adminService.sendGlobalNotification.mockResolvedValue({
      data: { success: true },
    });
    adminService.sendPlanNotification.mockResolvedValue({
      data: { success: true },
    });
    adminService.scheduleNotification.mockResolvedValue({
      data: { success: true },
    });
    adminService.cancelScheduledNotification.mockResolvedValue({
      data: { success: true },
    });
  });

  it("renders send notification form by default and fetches data", async () => {
    render(<AdminPushNotifications />);

    expect(screen.getByText("Broadcast to All")).toBeInTheDocument();
    expect(screen.getByText("Targeted Plan Notification")).toBeInTheDocument();

    await waitFor(() => {
      expect(adminService.getNotificationHistory).toHaveBeenCalled();
      expect(adminService.getScheduledNotifications).toHaveBeenCalled();
    });
  });

  it("validates empty inputs for global broadcast", async () => {
    render(<AdminPushNotifications />);

    const sendBtn = screen.getByRole("button", {
      name: /Send Global Broadcast/i,
    });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please fill in title and message",
      );
      expect(adminService.sendGlobalNotification).not.toHaveBeenCalled();
    });
  });

  it("handles sending a global notification successfully", async () => {
    render(<AdminPushNotifications />);

    const titleInput = screen.getByPlaceholderText(/e.g., System Maintenance/i);
    const messageInput = screen.getByPlaceholderText(/Type your message here/i);
    const actionUrlInput =
      screen.getAllByPlaceholderText(/e.g., \/marketplace/i)[0]; // First one is global

    fireEvent.change(titleInput, { target: { value: "Global Title" } });
    fireEvent.change(messageInput, { target: { value: "Global Message" } });
    fireEvent.change(actionUrlInput, { target: { value: "/test-url" } });

    const sendBtn = screen.getByRole("button", {
      name: /Send Global Broadcast/i,
    });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(adminService.sendGlobalNotification).toHaveBeenCalledWith({
        title: "Global Title",
        message: "Global Message",
        actionUrl: "/test-url",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Notification sent to all active users!",
      );
      expect(titleInput.value).toBe("");
    });
  });

  it("handles error when sending a global notification", async () => {
    adminService.sendGlobalNotification.mockRejectedValueOnce(
      new Error("Send Failed"),
    );
    render(<AdminPushNotifications />);

    fireEvent.change(screen.getByPlaceholderText(/e.g., System Maintenance/i), {
      target: { value: "Global Title" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Type your message here/i), {
      target: { value: "Global Message" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Send Global Broadcast/i }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to process notification",
      );
    });
  });

  it("validates empty inputs for scheduled global broadcast", async () => {
    render(<AdminPushNotifications />);

    fireEvent.change(screen.getByPlaceholderText(/e.g., System Maintenance/i), {
      target: { value: "Global Title" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Type your message here/i), {
      target: { value: "Global Message" },
    });

    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[0]);

    const scheduleBtn = screen.getByRole("button", {
      name: /Schedule Broadcast/i,
    });
    fireEvent.click(scheduleBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please select a schedule date");
      expect(adminService.scheduleNotification).not.toHaveBeenCalled();
    });
  });

  it("handles scheduling a global notification successfully", async () => {
    render(<AdminPushNotifications />);

    fireEvent.change(screen.getByPlaceholderText(/e.g., System Maintenance/i), {
      target: { value: "Global Title" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Type your message here/i), {
      target: { value: "Global Message" },
    });

    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[0]);

    // Fill in date
    const dateInput = screen.getByLabelText(/Date & Time/i);
    const futureDate = new Date(Date.now() + 86400000)
      .toISOString()
      .slice(0, 16);
    fireEvent.change(dateInput, { target: { value: futureDate } });

    const scheduleBtn = screen.getByRole("button", {
      name: /Schedule Broadcast/i,
    });
    fireEvent.click(scheduleBtn);

    await waitFor(() => {
      expect(adminService.scheduleNotification).toHaveBeenCalledWith({
        title: "Global Title",
        message: "Global Message",
        actionUrl: "",
        target: "all",
        scheduledFor: futureDate,
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Notification scheduled successfully!",
      );
    });
  });

  it("applies presets correctly", async () => {
    render(<AdminPushNotifications />);

    const alertPresetBtn = screen.getByTitle("Maintenance preset");
    fireEvent.click(alertPresetBtn);

    const titleInput = screen.getByPlaceholderText(/e.g., System Maintenance/i);
    expect(titleInput.value).toBe("System Maintenance");

    const planPresetBtn = screen.getByTitle("New plan preset");
    fireEvent.click(planPresetBtn);

    expect(titleInput.value).toBe("New Subscription Plan!");
  });

  it("handles sending a plan notification successfully", async () => {
    render(<AdminPushNotifications />);

    const titleInput = screen.getByPlaceholderText(
      /e.g., Exclusive Gold Offer/i,
    );
    const messageInput = screen.getByPlaceholderText(
      /Type your message for tier users/i,
    );

    fireEvent.change(titleInput, { target: { value: "Plan Title" } });
    fireEvent.change(messageInput, { target: { value: "Plan Message" } });

    const platinumBtn = screen.getByRole("button", { name: /platinum/i });
    fireEvent.click(platinumBtn);

    const sendBtn = screen.getByRole("button", {
      name: /Send Target Notification/i,
    });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(adminService.sendPlanNotification).toHaveBeenCalledWith({
        plan: "platinum",
        title: "Plan Title",
        message: "Plan Message",
        actionUrl: "",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Notification sent to platinum users!",
      );
    });
  });

  it("validates empty inputs for plan notification", async () => {
    render(<AdminPushNotifications />);

    const sendBtn = screen.getByRole("button", {
      name: /Send Target Notification/i,
    });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please fill in title and message",
      );
    });
  });

  it("handles scheduling a plan notification successfully", async () => {
    render(<AdminPushNotifications />);

    fireEvent.change(
      screen.getByPlaceholderText(/e.g., Exclusive Gold Offer/i),
      { target: { value: "Plan Title" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText(/Type your message for tier users/i),
      { target: { value: "Plan Message" } },
    );

    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[1]);

    const dateInput = screen.getByLabelText(/Date & Time/i);
    const futureDate = new Date(Date.now() + 86400000)
      .toISOString()
      .slice(0, 16);
    fireEvent.change(dateInput, { target: { value: futureDate } });

    const scheduleBtn = screen.getByRole("button", {
      name: /Schedule Notification/i,
    });
    fireEvent.click(scheduleBtn);

    await waitFor(() => {
      expect(adminService.scheduleNotification).toHaveBeenCalledWith({
        plan: "silver",
        title: "Plan Title",
        message: "Plan Message",
        actionUrl: "",
        target: "plan",
        targetPlan: "silver",
        scheduledFor: futureDate,
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Notification scheduled for silver users!",
      );
    });
  });

  it("switches tabs to scheduled and renders scheduled notifications", async () => {
    render(<AdminPushNotifications />);

    const scheduledTab = screen.getByRole("button", { name: /Scheduled/i });
    fireEvent.click(scheduledTab);

    await waitFor(() => {
      expect(screen.getByText("Scheduled Alert")).toBeInTheDocument();
      expect(screen.getByText("Scheduled Plan")).toBeInTheDocument();
      expect(screen.getByText("gold Users")).toBeInTheDocument();
    });
  });

  it("handles cancelling a scheduled notification", async () => {
    render(<AdminPushNotifications />);

    const scheduledTab = screen.getByRole("button", { name: /Scheduled/i });
    fireEvent.click(scheduledTab);

    await waitFor(() => {
      expect(screen.getByText("Scheduled Alert")).toBeInTheDocument();
    });

    const cancelBtns = screen.getAllByTitle("Cancel");
    fireEvent.click(cancelBtns[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      "Are you sure you want to cancel this scheduled notification?",
    );

    await waitFor(() => {
      expect(adminService.cancelScheduledNotification).toHaveBeenCalledWith(
        "s1",
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Scheduled notification cancelled",
      );
      expect(adminService.getScheduledNotifications).toHaveBeenCalledTimes(2);
    });
  });

  it("handles error when cancelling a scheduled notification", async () => {
    adminService.cancelScheduledNotification.mockRejectedValueOnce(
      new Error("Cancel failed"),
    );
    render(<AdminPushNotifications />);

    const scheduledTab = screen.getByRole("button", { name: /Scheduled/i });
    fireEvent.click(scheduledTab);

    await waitFor(() => {
      expect(screen.getByText("Scheduled Alert")).toBeInTheDocument();
    });

    const cancelBtns = screen.getAllByTitle("Cancel");
    fireEvent.click(cancelBtns[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to cancel schedule");
    });
  });

  it("does not cancel if confirmation is rejected", async () => {
    vi.spyOn(window, "confirm").mockImplementationOnce(() => false);
    render(<AdminPushNotifications />);

    const scheduledTab = screen.getByRole("button", { name: /Scheduled/i });
    fireEvent.click(scheduledTab);

    await waitFor(() => {
      expect(screen.getByText("Scheduled Alert")).toBeInTheDocument();
    });

    const cancelBtns = screen.getAllByTitle("Cancel");
    fireEvent.click(cancelBtns[0]);

    expect(adminService.cancelScheduledNotification).not.toHaveBeenCalled();
  });

  it("renders empty scheduled state correctly", async () => {
    adminService.getScheduledNotifications.mockResolvedValueOnce({ data: [] });
    render(<AdminPushNotifications />);

    const scheduledTab = screen.getByRole("button", { name: /Scheduled/i });
    fireEvent.click(scheduledTab);

    await waitFor(() => {
      expect(screen.getByText("No pending schedules")).toBeInTheDocument();
    });
  });

  it("switches tabs to history and renders message history", async () => {
    render(<AdminPushNotifications />);

    const historyTab = screen.getByRole("button", { name: /Message History/i });
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText("Past Alert")).toBeInTheDocument();
      expect(screen.getByText("gold")).toBeInTheDocument();
    });
  });

  it("renders empty history state correctly", async () => {
    adminService.getNotificationHistory.mockResolvedValueOnce({ data: [] });
    render(<AdminPushNotifications />);

    const historyTab = screen.getByRole("button", { name: /Message History/i });
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText("No history found")).toBeInTheDocument();
    });
  });

  it("switches tabs to settings", async () => {
    render(<AdminPushNotifications />);

    const settingsTab = screen.getByRole("button", {
      name: /Automation Info/i,
    });
    fireEvent.click(settingsTab);

    await waitFor(() => {
      expect(
        screen.getByText("Subscription Auto-Reminders"),
      ).toBeInTheDocument();
      expect(screen.getByText("Push Best Practices")).toBeInTheDocument();
    });
  });
});
