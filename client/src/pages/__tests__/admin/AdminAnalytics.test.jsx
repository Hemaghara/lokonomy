import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminAnalytics from "../../admin/AdminAnalytics";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../services", () => ({
  adminService: {
    getAnalyticsOverview: vi.fn(),
    getUserGrowth: vi.fn(),
    getBusinessGrowth: vi.fn(),
    getJobTrends: vi.fn(),
    getRevenueTrends: vi.fn(),
    getRegionStats: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock Recharts to prevent SVG rendering issues in JSDOM
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => (
    <div data-testid="recharts-container">{children}</div>
  ),
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe("AdminAnalytics Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful resolves to prevent unhandled rejections in tests
    adminService.getAnalyticsOverview.mockResolvedValue({
      data: {
        totalUsers: 1000,
        newUsersThisMonth: 100,
        totalBusinesses: 200,
        newBusinessesThisMonth: 20,
        totalJobs: 50,
        newJobsThisMonth: 5,
        totalApplications: 300,
        totalRevenue: 50000,
        revenueThisMonth: 5000,
      },
    });
    adminService.getUserGrowth.mockResolvedValue({
      data: { series: [{ label: "Jan", count: 10 }] },
    });
    adminService.getBusinessGrowth.mockResolvedValue({
      data: { series: [{ label: "Jan", count: 5 }] },
    });
    adminService.getJobTrends.mockResolvedValue({
      data: { series: [{ label: "Jan", jobs: 2, applications: 10 }] },
    });
    adminService.getRevenueTrends.mockResolvedValue({
      data: {
        series: [{ label: "Jan", silver: 100, gold: 200, platinum: 300 }],
        planBreakdown: [],
      },
    });
    adminService.getRegionStats.mockResolvedValue({
      data: { regions: [{ name: "North", users: 500, businesses: 100 }] },
    });
  });

  it("renders loading states initially", () => {
    adminService.getAnalyticsOverview.mockReturnValue(new Promise(() => {}));

    render(<AdminAnalytics />);
    expect(screen.getByText("Analytics &")).toBeInTheDocument();
    expect(screen.getAllByText("Loading chart…").length).toBeGreaterThan(0);
  });

  it("fetches and renders all data correctly", async () => {
    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(adminService.getAnalyticsOverview).toHaveBeenCalled();
      expect(adminService.getUserGrowth).toHaveBeenCalledWith("monthly");
      expect(adminService.getBusinessGrowth).toHaveBeenCalledWith("monthly");
      expect(adminService.getJobTrends).toHaveBeenCalledWith("monthly");
      expect(adminService.getRevenueTrends).toHaveBeenCalledWith("monthly");
      expect(adminService.getRegionStats).toHaveBeenCalled();

      // Check KPI cards
      expect(screen.getByText("1,000", { selector: 'p' })).toBeInTheDocument(); // Total Users
      expect(screen.getByText("200", { selector: 'p' })).toBeInTheDocument(); // Total Businesses
      expect(screen.getByText("50", { selector: 'p' })).toBeInTheDocument(); // Total Jobs
      expect(screen.getByText("₹50,000")).toBeInTheDocument(); // Total Revenue

      // Check charts rendered
      expect(screen.getAllByTestId("recharts-container").length).toBe(5); // Regions, Users, Biz, Jobs, Rev
    });
  });

  it("handles period filtering for user growth", async () => {
    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(adminService.getUserGrowth).toHaveBeenCalledWith("monthly");
    });

    adminService.getUserGrowth.mockClear();

    // The "Daily", "Weekly", "Monthly" buttons are mapped multiple times for different charts
    // Let's target the one in the User Growth section.
    // We can do it by finding the User Growth section first.
    const userGrowthSection = screen
      .getByText("User Growth")
      .closest(".bg-slate-900\\/50");
    // Using simple fireEvent on the label inside that section
    // Actually we can just find all "Daily" buttons and click the first one (which is user growth)
    const dailyBtns = screen.getAllByText("Daily");
    fireEvent.click(dailyBtns[0]);

    await waitFor(() => {
      expect(adminService.getUserGrowth).toHaveBeenCalledWith("daily");
    });
  });

  it("handles global refresh button", async () => {
    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(adminService.getAnalyticsOverview).toHaveBeenCalledTimes(1);
    });

    adminService.getAnalyticsOverview.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /Refresh/i }));

    expect(adminService.getAnalyticsOverview).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Refreshed!");
  });

  it("handles CSV download", async () => {
    global.URL.createObjectURL = vi.fn();
    global.URL.revokeObjectURL = vi.fn();

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText("1,000", { selector: 'p' })).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole("button", {
      name: /Download Report/i,
    });
    fireEvent.click(downloadBtn);

    expect(toast.success).toHaveBeenCalledWith("Full report downloaded!");
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("handles empty chart states", async () => {
    adminService.getUserGrowth.mockResolvedValueOnce({ data: { series: [] } });

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(
        screen.getAllByText("No data available for this period").length,
      ).toBeGreaterThan(0);
    });
  });

  it("handles api errors gracefully", async () => {
    adminService.getAnalyticsOverview.mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<AdminAnalytics />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load overview");
    });
  });
});
