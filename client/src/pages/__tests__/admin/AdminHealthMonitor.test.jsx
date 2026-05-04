import React from "react";
import { render, screen, fireEvent, waitFor, act } from "../../../utils/test-utils";
import AdminHealthMonitor from "../../admin/AdminHealthMonitor";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock("../../../services", () => ({
  adminService: {
    getHealthStatus: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockHealthData = {
  data: {
    api: "healthy",
    database: "healthy",
    redis: "healthy",
    cpu: 45,
    memory: 60,
    uptime: "15d 4h 20m",
    dbPing: 12,
  },
};

describe("AdminHealthMonitor Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders initial checking state and fetches data", async () => {
    adminService.getHealthStatus.mockReturnValue(new Promise(() => {})); // pending promise
    render(<AdminHealthMonitor />);

    // Header
    expect(screen.getByRole("heading", { name: /Health Monitor/i })).toBeInTheDocument();

    // Initial checking state
    const checkingIndicators = screen.getAllByText("Checking");
    expect(checkingIndicators.length).toBeGreaterThan(0);
  });

  it("renders health stats after successful fetch", async () => {
    adminService.getHealthStatus.mockResolvedValue(mockHealthData);
    render(<AdminHealthMonitor />);

    await waitFor(() => {
      expect(adminService.getHealthStatus).toHaveBeenCalledTimes(1);
    });

    // Status indicators
    const healthyIndicators = screen.getAllByText("Healthy");
    // API, DB, Redis + Hardcoded Security Layer = 4
    expect(healthyIndicators.length).toBeGreaterThanOrEqual(4);

    // CPU & Memory
    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();

    // Uptime
    expect(screen.getByText("15d 4h 20m")).toBeInTheDocument();

    // Incident log
    expect(screen.getByText("Primary DB Latency: 12ms")).toBeInTheDocument();

    // Toast
    expect(toast.success).toHaveBeenCalledWith("Health status updated");
  });

  it("handles API failure correctly", async () => {
    adminService.getHealthStatus.mockRejectedValue(new Error("API Down"));
    await act(async () => {
      render(<AdminHealthMonitor />);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to check system health");
    });

    // Should show down status for API and DB
    const downIndicators = screen.getAllByText("Down");
    expect(downIndicators.length).toBeGreaterThanOrEqual(2);
  });

  it("handles manual refresh", async () => {
    adminService.getHealthStatus.mockResolvedValue(mockHealthData);
    render(<AdminHealthMonitor />);

    await waitFor(() => {
      expect(adminService.getHealthStatus).toHaveBeenCalledTimes(1);
    });

    const refreshBtn = screen.getByRole("button", {
      name: /Refresh Diagnostics/i,
    });
    await act(async () => {
      fireEvent.click(refreshBtn);
    });

    await waitFor(() => {
      expect(adminService.getHealthStatus).toHaveBeenCalledTimes(2);
    });
  });

  it("polls health data on interval", async () => {
    vi.useFakeTimers();
    adminService.getHealthStatus.mockResolvedValue(mockHealthData);
    
    await act(async () => {
      render(<AdminHealthMonitor />);
    });

    expect(adminService.getHealthStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(adminService.getHealthStatus).toHaveBeenCalledTimes(2);
  });
});
