import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminActivityHeatmap from "../../admin/AdminActivityHeatmap";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../services", () => ({
  adminService: {
    getHeatmapData: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock react-calendar-heatmap as it relies on SVG which can be complex in JSDOM
vi.mock("react-calendar-heatmap", () => ({
  default: ({ values, classForValue }) => (
    <div data-testid="calendar-heatmap">
      {values.map((v, i) => (
        <span
          key={i}
          data-testid={`heatmap-cell-${i}`}
          className={classForValue(v)}
        >
          {v.date}:{v.count}
        </span>
      ))}
    </div>
  ),
}));

describe("AdminActivityHeatmap Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    dates: [
      { date: "2026-04-01", signups: 5, revenue: 1000, reports: 0, content: 2 },
      {
        date: "2026-04-02",
        signups: 20,
        revenue: 5000,
        reports: 1,
        content: 5,
      },
      { date: "2026-04-03", signups: 0, revenue: 0, reports: 0, content: 0 },
    ],
  };

  it("renders loading state initially and then data", async () => {
    adminService.getHeatmapData.mockReturnValue(new Promise(() => {})); // Never resolves to keep loading state

    render(<AdminActivityHeatmap />);
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText("Activity Heatmap")).toBeInTheDocument();

    // Refresh button should have animate-spin class on its icon during loading
    const refreshBtn = screen.getByRole("button", { name: /Refresh/i });
    expect(refreshBtn).toBeDisabled();
  });

  it("fetches and renders heatmap data successfully", async () => {
    adminService.getHeatmapData.mockResolvedValueOnce({ data: mockData });
    render(<AdminActivityHeatmap />);

    await waitFor(() => {
      expect(adminService.getHeatmapData).toHaveBeenCalledWith(365);
      expect(screen.getByTestId("calendar-heatmap")).toBeInTheDocument();
    });

    // By default metric is signups
    expect(screen.getByText("Daily signups Distribution")).toBeInTheDocument();
    expect(screen.getByText("2026-04-01:5")).toBeInTheDocument();
    expect(screen.getByText("2026-04-02:20")).toBeInTheDocument();

    // Total signups = 5 + 20 + 0 = 25
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(
      screen.getByText("Total signups (Last 365 Days)"),
    ).toBeInTheDocument();
  });

  it("handles metric switching", async () => {
    adminService.getHeatmapData.mockResolvedValueOnce({ data: mockData });
    render(<AdminActivityHeatmap />);

    await waitFor(() => {
      expect(screen.getByTestId("calendar-heatmap")).toBeInTheDocument();
    });

    // Switch to revenue
    fireEvent.click(screen.getByRole("button", { name: /Revenue/i }));

    expect(screen.getByText("Daily revenue Distribution")).toBeInTheDocument();
    expect(screen.getByText("2026-04-01:1000")).toBeInTheDocument();

    // Total revenue = 1000 + 5000 + 0 = 6000
    expect(screen.getByText("6,000")).toBeInTheDocument();
  });

  it("handles manual refresh", async () => {
    adminService.getHeatmapData.mockResolvedValue({ data: mockData });
    render(<AdminActivityHeatmap />);

    await waitFor(() => {
      expect(screen.getByTestId("calendar-heatmap")).toBeInTheDocument();
    });

    adminService.getHeatmapData.mockClear();

    const refreshBtn = screen.getByRole("button", { name: /Refresh/i });
    fireEvent.click(refreshBtn);

    expect(adminService.getHeatmapData).toHaveBeenCalledTimes(1);
  });

  it("handles fetch error gracefully", async () => {
    adminService.getHeatmapData.mockRejectedValueOnce(
      new Error("Network error"),
    );
    render(<AdminActivityHeatmap />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch heatmap data");
    });
  });

  it("calculates classForValue correctly based on metric thresholds", async () => {
    adminService.getHeatmapData.mockResolvedValueOnce({ data: mockData });
    render(<AdminActivityHeatmap />);

    await waitFor(() => {
      expect(screen.getByTestId("calendar-heatmap")).toBeInTheDocument();
    });

    // Signups: 5 should be color-scale-2
    const cell1 = screen.getByTestId("heatmap-cell-0");
    expect(cell1.className).toContain("color-scale-2");

    // Switch to revenue
    fireEvent.click(screen.getByRole("button", { name: /Revenue/i }));

    // Revenue: 1000 should be color-scale-2
    expect(cell1.className).toContain("color-scale-2");
  });
});
