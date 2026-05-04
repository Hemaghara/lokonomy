import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminReviewAnalytics from "../../../pages/admin/AdminReviewAnalytics";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";
import html2pdf from "html2pdf.js";

vi.mock("../../../services", () => ({
  adminService: {
    getBusinessReviewAnalytics: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(() => "toast-id"),
  },
}));

vi.mock("html2pdf.js", () => {
  const save = vi.fn().mockResolvedValue(true);
  const from = vi.fn().mockReturnValue({ save });
  const set = vi.fn().mockReturnValue({ from });
  return {
    default: vi.fn().mockReturnValue({ set }),
  };
});

vi.mock("recharts", () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div data-testid="pie">{children}</div>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockAnalyticsData = {
  businessName: "Test Business",
  totalReviews: 100,
  averageRating: 4.5,
  ratingDistribution: {
    1: 5,
    2: 5,
    3: 10,
    4: 30,
    5: 50,
  },
};

const mockPoorAnalyticsData = {
  businessName: "Poor Business",
  totalReviews: 100,
  averageRating: 2.0,
  ratingDistribution: {
    1: 50,
    2: 30,
    3: 10,
    4: 5,
    5: 5,
  },
};

const mockEmptyAnalyticsData = {
  businessName: "Empty Business",
  totalReviews: 0,
  averageRating: 0,
  ratingDistribution: {},
};

describe("AdminReviewAnalytics Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/admin/reviews/analytics/biz123"]}>
        <Routes>
          <Route
            path="/admin/reviews/analytics/:businessId"
            element={<AdminReviewAnalytics />}
          />
          <Route path="/admin/reviews" element={<div>Reviews Page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it("renders loading state initially", () => {
    adminService.getBusinessReviewAnalytics.mockImplementation(
      () => new Promise(() => {}),
    );
    renderComponent();
    expect(screen.getByText(/Analyzing feedback data.../i)).toBeInTheDocument();
  });

  it("fetches and displays analytics data successfully", async () => {
    adminService.getBusinessReviewAnalytics.mockResolvedValue({
      data: mockAnalyticsData,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Test Business")).toBeInTheDocument();
    });

    expect(screen.getAllByText('100')[0]).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("handles error fetching data and navigates back", async () => {
    adminService.getBusinessReviewAnalytics.mockRejectedValue(
      new Error("Fetch error"),
    );
    renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to fetch analytics data",
      );
      expect(screen.getByText("Reviews Page")).toBeInTheDocument();
    });
  });

  it("generates report when button is clicked", async () => {
    adminService.getBusinessReviewAnalytics.mockResolvedValue({
      data: mockAnalyticsData,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Test Business")).toBeInTheDocument();
    });

    const generateBtn = screen.getByRole("button", {
      name: /Generate Full Report/i,
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText("Performance Report")).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole("button", {
      name: /Download Executive Report/i,
    });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(html2pdf).toHaveBeenCalled();
      expect(toast.loading).toHaveBeenCalledWith(
        "Generating your secure report...",
      );
    });
  });

  it("displays correct insights for excellent performance", async () => {
    adminService.getBusinessReviewAnalytics.mockResolvedValue({
      data: mockAnalyticsData,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Test Business")).toBeInTheDocument();
    });

    const generateBtn = screen.getByRole("button", {
      name: /Generate Full Report/i,
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Exceptional performance: The business maintains an elite satisfaction level./i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("displays correct insights for poor performance", async () => {
    adminService.getBusinessReviewAnalytics.mockResolvedValue({
      data: mockPoorAnalyticsData,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Poor Business")).toBeInTheDocument();
    });

    const generateBtn = screen.getByRole("button", {
      name: /Generate Full Report/i,
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Critical Alert: High volume of negative feedback detected/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("displays correct insights when there is no data", async () => {
    adminService.getBusinessReviewAnalytics.mockResolvedValue({
      data: mockEmptyAnalyticsData,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Empty Business")).toBeInTheDocument();
    });

    const generateBtn = screen.getByRole("button", {
      name: /Generate Full Report/i,
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/No data available for analysis./i),
      ).toBeInTheDocument();
    });
  });

  it("closes the report preview", async () => {
    adminService.getBusinessReviewAnalytics.mockResolvedValue({
      data: mockAnalyticsData,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Test Business")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Generate Full Report/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("Performance Report")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Close Preview/i }));

    await waitFor(() => {
      expect(screen.queryByText("Performance Report")).not.toBeInTheDocument();
    });
  });

  it("navigates back to reviews management", async () => {
    adminService.getBusinessReviewAnalytics.mockResolvedValue({
      data: mockAnalyticsData,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Test Business")).toBeInTheDocument();
    });

    const backBtn = screen.getByRole("button", { name: /Back to Management/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText("Reviews Page")).toBeInTheDocument();
    });
  });

  it("handles PDF generation failure", async () => {
    adminService.getBusinessReviewAnalytics.mockResolvedValue({
      data: mockAnalyticsData,
    });

    // Override the mock to simulate a failure
    const mockSave = vi
      .fn()
      .mockRejectedValue(new Error("PDF generation failed"));
    html2pdf.mockReturnValueOnce({
      set: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          save: mockSave,
        }),
      }),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Test Business")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Generate Full Report/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("Performance Report")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Download Executive Report/i }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Generation failed. Try again.",
        expect.any(Object),
      );
    });
  });
});
