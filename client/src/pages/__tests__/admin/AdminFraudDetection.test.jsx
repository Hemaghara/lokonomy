import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminFraudDetection from "../../admin/AdminFraudDetection";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../services", () => ({
  adminService: {
    getFraudSignals: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    error: vi.fn(),
  },
}));

const mockData = {
  data: {
    total: 3,
    critical: 1,
    high: 1,
    medium: 1,
    signals: [
      {
        title: "Review Bombing Detected",
        severity: "critical",
        type: "review_bombing",
        detail: "Multiple negative reviews from same IP range",
        riskScore: 90,
        actionPath: "/admin/businesses/b1",
        entities: [{ name: "Tech Store" }, { name: "User 1" }],
      },
      {
        title: "Duplicate Phone Numbers",
        severity: "high",
        type: "duplicate_phone",
        detail: "5 accounts sharing the same phone number",
        riskScore: 70,
        actionPath: "/admin/users",
        entities: [{ name: "Phone 1234567890" }],
      },
      {
        title: "Suspicious Job Postings",
        severity: "medium",
        type: "duplicate_jobs",
        detail: "Job posting identical to 3 others",
        riskScore: 40,
        actionPath: "/admin/jobs/j1",
        entities: [],
      },
    ],
  },
};

describe("AdminFraudDetection Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    adminService.getFraudSignals.mockReturnValue(new Promise(() => {}));
    render(<AdminFraudDetection />);
    expect(screen.getByRole("button", { name: /Refresh/i })).toBeDisabled();
    expect(
      screen.queryByText("Review Bombing Detected"),
    ).not.toBeInTheDocument();
  });

  it("renders stats and signals correctly", async () => {
    adminService.getFraudSignals.mockResolvedValue(mockData);
    render(<AdminFraudDetection />);

    await screen.findByText("Review Bombing Detected");

    // Check Stats
    expect(screen.getByText("3")).toBeInTheDocument(); // Total
    const ones = screen.getAllByText("1"); // Critical, High, Medium
    expect(ones.length).toBeGreaterThanOrEqual(3);

    // Check signals
    expect(screen.getByText("Duplicate Phone Numbers")).toBeInTheDocument();
    expect(screen.getByText("Suspicious Job Postings")).toBeInTheDocument();

    // Check entities
    expect(screen.getByText("Tech Store")).toBeInTheDocument();
    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.getByText("Phone 1234567890")).toBeInTheDocument();

    // Check risk scores
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("70")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
  });

  it("handles empty state", async () => {
    adminService.getFraudSignals.mockResolvedValue({
      data: { total: 0, critical: 0, high: 0, medium: 0, signals: [] },
    });
    render(<AdminFraudDetection />);

    await screen.findByText("No Signals Detected");
    expect(
      screen.getByText("Platform looks clean for the selected filter."),
    ).toBeInTheDocument();
  });

  it("handles filtering by severity", async () => {
    adminService.getFraudSignals.mockResolvedValue(mockData);
    render(<AdminFraudDetection />);

    await screen.findByText("Review Bombing Detected");

    // Filter by critical
    const criticalBtn = screen.getByRole("button", { name: /^critical$/i });
    fireEvent.click(criticalBtn);

    expect(screen.getByText("Review Bombing Detected")).toBeInTheDocument();
    expect(
      screen.queryByText("Duplicate Phone Numbers"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Suspicious Job Postings"),
    ).not.toBeInTheDocument();

    // Filter by high
    const highBtn = screen.getByRole("button", { name: /^high$/i });
    fireEvent.click(highBtn);

    expect(
      screen.queryByText("Review Bombing Detected"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Duplicate Phone Numbers")).toBeInTheDocument();

    // Filter by medium
    const mediumBtn = screen.getByRole("button", { name: /^medium$/i });
    fireEvent.click(mediumBtn);

    expect(screen.getByText("Suspicious Job Postings")).toBeInTheDocument();

    // Filter by all
    const allBtn = screen.getByRole("button", { name: /^all$/i });
    fireEvent.click(allBtn);

    expect(screen.getByText("Review Bombing Detected")).toBeInTheDocument();
    expect(screen.getByText("Duplicate Phone Numbers")).toBeInTheDocument();
  });

  it("navigates to action path on review button click", async () => {
    adminService.getFraudSignals.mockResolvedValue(mockData);
    render(<AdminFraudDetection />);

    await screen.findByText("Review Bombing Detected");

    const reviewBtns = screen.getAllByRole("button", { name: /Review/i });
    fireEvent.click(reviewBtns[0]); // First is critical

    expect(mockNavigate).toHaveBeenCalledWith("/admin/businesses/b1");
  });

  it("handles manual refresh", async () => {
    adminService.getFraudSignals.mockResolvedValue(mockData);
    render(<AdminFraudDetection />);

    await screen.findByText("Review Bombing Detected");

    const refreshBtn = screen.getByRole("button", { name: /Refresh/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(adminService.getFraudSignals).toHaveBeenCalledTimes(2);
    });
  });

  it("shows error toast when fetching signals fails", async () => {
    adminService.getFraudSignals.mockRejectedValue(new Error("Fetch error"));
    render(<AdminFraudDetection />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load fraud signals");
    });
  });
});
