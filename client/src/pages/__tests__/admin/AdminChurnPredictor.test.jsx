import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminChurnPredictor from "../../admin/AdminChurnPredictor";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../services", () => ({
  adminService: {
    getChurnData: vi.fn(),
    sendRenewalReminder: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockData = {
  data: {
    summary: {
      total: 10,
      highRisk: 3,
      mediumRisk: 5,
      lowRisk: 2,
    },
    users: [
      {
        _id: "u1",
        name: "John Doe",
        email: "john@example.com",
        churnRisk: "high",
        subscription: {
          plan: "Premium",
          expiryDate: new Date(Date.now() + 172800000).toISOString(), // 2 days
        },
        daysLeft: 2,
        daysSinceLogin: 15,
      },
      {
        _id: "u2",
        name: "Jane Smith",
        email: "jane@example.com",
        churnRisk: "low",
        subscription: {
          plan: "Basic",
          expiryDate: new Date(Date.now() + 864000000).toISOString(), // 10 days
        },
        daysLeft: 10,
        daysSinceLogin: null,
      },
    ],
  },
};

describe("AdminChurnPredictor Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    adminService.getChurnData.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<AdminChurnPredictor />);
    expect(screen.getByRole("button", { name: /Refresh/i })).toBeDisabled();
    // Since there's no specific role for the skeleton, we can check if data summary is NOT present yet
    expect(screen.queryByText("Expiring Soon")).not.toBeInTheDocument();
  });

  it("renders summary stats and user list correctly", async () => {
    adminService.getChurnData.mockResolvedValue(mockData);
    render(<AdminChurnPredictor />);

    await screen.findByText(/John Doe/i);
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    // Check stats
    expect(screen.getByText("10")).toBeInTheDocument(); // total
    expect(screen.getByText("3")).toBeInTheDocument(); // high
    expect(screen.getByText("5")).toBeInTheDocument(); // medium
    expect(screen.getByText("2")).toBeInTheDocument(); // low

    // Check plan
    expect(screen.getByText(/Premium/i)).toBeInTheDocument();
    expect(screen.getByText(/Basic/i)).toBeInTheDocument();

    // Check risk levels
    expect(screen.getAllByText(/High Risk/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Low Risk/i).length).toBeGreaterThan(0);

    // Check days since login
    expect(screen.getByText(/15d since login/i)).toBeInTheDocument();
    expect(screen.getByText(/Never logged in/i)).toBeInTheDocument();
  });

  it("displays empty state when no users are expiring", async () => {
    adminService.getChurnData.mockResolvedValue({
      data: {
        summary: { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 },
        users: [],
      },
    });
    render(<AdminChurnPredictor />);

    await screen.findByText(/No Impending Churn/i);
    expect(
      screen.getByText(/No subscriptions expiring in the selected range/i),
    ).toBeInTheDocument();
  });

  it("handles range switching", async () => {
    adminService.getChurnData.mockResolvedValue(mockData);
    render(<AdminChurnPredictor />);

    await screen.findByText(/John Doe/i);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "7" } });

    await waitFor(() => {
      expect(adminService.getChurnData).toHaveBeenCalledWith(7);
    });

    fireEvent.change(select, { target: { value: "14" } });

    await waitFor(() => {
      expect(adminService.getChurnData).toHaveBeenCalledWith(14);
    });
  });

  it("handles sending renewal reminder successfully", async () => {
    adminService.getChurnData.mockResolvedValue(mockData);
    adminService.sendRenewalReminder.mockResolvedValue({
      data: { success: true },
    });
    render(<AdminChurnPredictor />);

    await screen.findByText("John Doe");

    const sendBtns = screen.getAllByTitle("Send Renewal Reminder");
    fireEvent.click(sendBtns[0]);

    await waitFor(() => {
      expect(adminService.sendRenewalReminder).toHaveBeenCalledWith("u1");
      expect(toast.success).toHaveBeenCalledWith(
        "Renewal reminder sent successfully",
      );
    });
  });

  it("handles sending renewal reminder failure", async () => {
    adminService.getChurnData.mockResolvedValue(mockData);
    adminService.sendRenewalReminder.mockRejectedValue(new Error("Send error"));
    render(<AdminChurnPredictor />);

    await screen.findByText("John Doe");

    const sendBtns = screen.getAllByTitle("Send Renewal Reminder");
    fireEvent.click(sendBtns[0]);

    await waitFor(() => {
      expect(adminService.sendRenewalReminder).toHaveBeenCalledWith("u1");
      expect(toast.error).toHaveBeenCalledWith("Failed to send reminder");
    });
  });

  it("handles manual refresh", async () => {
    adminService.getChurnData.mockResolvedValue(mockData);
    render(<AdminChurnPredictor />);

    await screen.findByText(/John Doe/i);
    const refreshBtn = screen.getByRole("button", { name: /Refresh/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(adminService.getChurnData).toHaveBeenCalledTimes(2); // Initial fetch + refresh
    });
  });

  it("shows error toast when fetching churn data fails", async () => {
    adminService.getChurnData.mockRejectedValue(new Error("Fetch error"));
    render(<AdminChurnPredictor />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch churn data");
    });
  });
});
