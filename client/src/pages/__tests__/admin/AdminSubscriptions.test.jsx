import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminSubscriptions from "../../admin/AdminSubscriptions";
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

// Mock AdminLayout
vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

// Mock recharts
vi.mock("recharts", () => ({
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Legend: () => <div />,
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock URL.createObjectURL and document body append/remove
global.URL.createObjectURL = vi.fn(() => "blob:mock");
global.URL.revokeObjectURL = vi.fn();
const mockClick = vi.fn();

beforeAll(() => {
  HTMLAnchorElement.prototype.click = mockClick;
});

// Mock adminService
vi.mock("../../../services", () => ({
  adminService: {
    getSubscriptionTransactions: vi.fn(),
    getRevenueData: vi.fn(),
    getFailedPayments: vi.fn(),
    getFinancialReport: vi.fn(),
    exportSubscriptionTransactions: vi.fn(),
  },
}));

const mockTransactions = [
  {
    _id: "t1",
    user: { name: "John Doe", email: "john@example.com" },
    plan: "gold",
    amount: 5000,
    status: "success",
    createdAt: new Date().toISOString(),
    durationMonths: 1,
  },
  {
    _id: "t2",
    user: null, // Deleted User
    plan: "silver",
    amount: 1000,
    status: "failed",
    createdAt: new Date().toISOString(),
    durationMonths: 1,
  },
  {
    _id: "t3",
    user: { name: "Pending User", email: "pend@example.com" },
    plan: "platinum",
    amount: 10000,
    status: "pending",
    createdAt: new Date().toISOString(),
    durationMonths: 1,
  },
];

const mockRevenueData = {
  labels: ["Jan", "Feb"],
  datasets: {
    total: [10000, 15000],
    silver: [2000, 3000],
    gold: [5000, 7000],
    platinum: [3000, 5000],
  },
  summary: {
    periodRevenue: 25000,
    revenueBreakdown: { silver: 5000, gold: 12000, platinum: 8000 },
  },
};

const mockFailedPayments = [
  {
    _id: "f1",
    user: { name: "Alice", email: "alice@example.com" },
    plan: "silver",
    amount: 1000,
    failureReason: "Card declined",
    createdAt: new Date().toISOString(),
  },
];

const mockFinancialReport = {
  report: {
    allTime: { totalRevenue: 100000, avgRevenuePerUser: 2000 },
    subscribers: {
      active: 50,
      expired: 5,
      byPlan: { silver: 20, gold: 20, platinum: 10 },
    },
    transactions: { successRate: 98, total: 100, failed: 2 },
    periodStats: { revenue: 10000 },
  },
};

describe("AdminSubscriptions Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getSubscriptionTransactions.mockResolvedValue({
      data: {
        transactions: mockTransactions,
        totalPages: 2,
        planStats: {},
        failedCount: 2,
      },
    });
    adminService.getRevenueData.mockResolvedValue({ data: mockRevenueData });
    adminService.getFailedPayments.mockResolvedValue({
      data: { payments: mockFailedPayments, totalPages: 1 },
    });
    adminService.getFinancialReport.mockResolvedValue({
      data: mockFinancialReport,
    });
    adminService.exportSubscriptionTransactions.mockResolvedValue({
      data: "csv data",
    });
  });

  it("renders transactions by default and handles pagination", async () => {
    render(<AdminSubscriptions />);

    await waitFor(() => {
      expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
      expect(screen.getAllByText(/₹5,000/)[0]).toBeInTheDocument();
      expect(screen.getAllByText("Deleted User")[0]).toBeInTheDocument();
    });

    // Check next page pagination
    const nextBtn = screen.getByRole("button", { name: /Next/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(adminService.getSubscriptionTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });

    const prevBtn = screen.getByRole("button", { name: /Prev/i });
    expect(prevBtn).not.toBeDisabled();
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(adminService.getSubscriptionTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      );
    });
  });

  it("handles loading and empty states for transactions", async () => {
    adminService.getSubscriptionTransactions.mockResolvedValueOnce({
      data: { transactions: [], totalPages: 1 },
    });
    render(<AdminSubscriptions />);

    await waitFor(() => {
      expect(screen.getByText("No transactions found.")).toBeInTheDocument();
    });
  });

  it("filters transactions by plan, status, and search", async () => {
    render(<AdminSubscriptions />);
    await waitFor(() => screen.getAllByText("John Doe")[0]);

    const planSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(planSelect, { target: { value: "gold" } });

    const statusSelect = screen.getAllByRole("combobox")[1];
    fireEvent.change(statusSelect, { target: { value: "success" } });

    const searchInput = screen.getByPlaceholderText(/Search transactions/i);
    fireEvent.change(searchInput, { target: { value: "John" } });

    await waitFor(() => {
      expect(adminService.getSubscriptionTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: "gold",
          status: "success",
          search: "John",
        }),
      );
    });
  });

  it("switches to revenue tab and displays chart with period picker", async () => {
    render(<AdminSubscriptions />);
    await waitFor(() => screen.getAllByText("John Doe")[0]);

    const revenueTab = screen.getAllByRole("button", { name: /Revenue/i })[0];
    fireEvent.click(revenueTab);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Revenue Growth/i }),
      ).toBeInTheDocument();
      expect(screen.getAllByText(/₹25,000/)[0]).toBeInTheDocument();
    });

    // Change period
    const weekBtn = screen.getByRole("button", { name: /week/i });
    fireEvent.click(weekBtn);

    await waitFor(() => {
      expect(adminService.getRevenueData).toHaveBeenCalledWith("week");
    });
  });

  it("switches to failures tab and handles empty state", async () => {
    render(<AdminSubscriptions />);
    await waitFor(() => screen.getAllByText("John Doe")[0]);

    const failedTab = screen.getAllByRole("button", { name: /Failures/i })[0];
    fireEvent.click(failedTab);

    await waitFor(() => {
      expect(screen.getAllByText("Alice")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Card declined")[0]).toBeInTheDocument();
    });

    // Empty state
    adminService.getFailedPayments.mockResolvedValueOnce({
      data: { payments: [] },
    });
    const refreshBtn = screen.getByTitle("Refresh");
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(
        screen.getByText("No failed payments recorded."),
      ).toBeInTheDocument();
    });
  });

  it("handles report export", async () => {
    render(<AdminSubscriptions />);
    await waitFor(() => screen.getAllByText("John Doe")[0]);

    const reportsTab = screen.getAllByRole("button", { name: /Reports/i })[0];
    fireEvent.click(reportsTab);

    await waitFor(() => screen.getAllByText("All-Time Revenue")[0]);

    const downloadBtn = screen.getAllByRole("button", { name: /Download/i })[0];
    fireEvent.click(downloadBtn);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Report exported successfully");
  });

  it("handles transactions export and export failure", async () => {
    render(<AdminSubscriptions />);
    await waitFor(() => screen.getAllByText("John Doe")[0]);

    const downloadBtn = screen.getAllByRole("button", { name: /Download/i })[0];
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(adminService.exportSubscriptionTransactions).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Transactions exported");
    });

    // Export failure
    adminService.exportSubscriptionTransactions.mockRejectedValueOnce(
      new Error("Export Error"),
    );
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Export failed");
    });
  });

  it("handles export button on revenue tab to switch to reports", async () => {
    render(<AdminSubscriptions />);
    await waitFor(() => screen.getAllByText("John Doe")[0]);

    const revenueTab = screen.getAllByRole("button", { name: /Revenue/i })[0];
    fireEvent.click(revenueTab);

    await waitFor(() => screen.getAllByText(/₹25,000/)[0]);

    const exportBtn = screen.getByRole("button", { name: /Export/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText("All-Time Revenue")).toBeInTheDocument();
    });
  });

  it("handles refresh button click", async () => {
    render(<AdminSubscriptions />);
    await waitFor(() => screen.getAllByText("John Doe")[0]);

    const refreshBtn = screen.getByTitle("Refresh");
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(adminService.getSubscriptionTransactions).toHaveBeenCalledTimes(2); // Initial + refetch
    });
  });
});
