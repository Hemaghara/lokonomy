import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminReviews from "../../../pages/admin/AdminReviews";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../services", () => ({
  adminService: {
    getBusinessReviews: vi.fn(),
    getProductReviews: vi.fn(),
    deleteBusinessReview: vi.fn(),
    deleteProductReview: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockBusinessReviews = {
  reviews: [
    {
      reviewId: "rev1",
      businessId: "biz1",
      userName: "Alice",
      businessName: "Test Business",
      rating: 5,
      comment: "Great business",
      createdAt: "2023-01-01T00:00:00Z",
    },
    {
      reviewId: "rev2",
      businessId: "biz2",
      userName: "Bob",
      businessName: "Another Business",
      rating: 3,
      comment: "Okay business",
      createdAt: "2023-01-02T00:00:00Z",
    },
  ],
  pages: 2,
};

const mockProductReviews = {
  reviews: [
    {
      reviewId: "prev1",
      productId: "prod1",
      userName: "Charlie",
      productName: "Test Product",
      rating: 4,
      comment: "Good product",
      createdAt: "2023-01-03T00:00:00Z",
    },
  ],
  pages: 1,
};

describe("AdminReviews Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/admin/reviews"]}>
        <Routes>
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route
            path="/admin/reviews/analytics/:businessId"
            element={<div>Analytics Page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );
  };

  it("renders loading state initially", () => {
    adminService.getBusinessReviews.mockImplementation(
      () => new Promise(() => {}),
    );
    renderComponent();
    expect(screen.getByText(/Fetching latest reviews.../i)).toBeInTheDocument();
  });

  it("fetches and displays business reviews successfully", async () => {
    adminService.getBusinessReviews.mockResolvedValue({
      data: mockBusinessReviews,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Test Business")).toBeInTheDocument();
      expect(screen.getByText('"Great business"')).toBeInTheDocument();
    });
  });

  it("handles error fetching business reviews", async () => {
    adminService.getBusinessReviews.mockRejectedValue(new Error("Fetch error"));
    renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch reviews");
    });
  });

  it("switches to product reviews tab and fetches data", async () => {
    adminService.getBusinessReviews.mockResolvedValue({
      data: mockBusinessReviews,
    });
    adminService.getProductReviews.mockResolvedValue({
      data: mockProductReviews,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const productTab = screen.getByRole("button", { name: /Product/i });
    fireEvent.click(productTab);

    await waitFor(() => {
      expect(adminService.getProductReviews).toHaveBeenCalled();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
      expect(screen.getByText("Test Product")).toBeInTheDocument();
    });
  });

  it("deletes a business review", async () => {
    adminService.getBusinessReviews.mockResolvedValue({
      data: mockBusinessReviews,
    });
    adminService.deleteBusinessReview.mockResolvedValue({});
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByTitle("Delete Review");
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(adminService.deleteBusinessReview).toHaveBeenCalledWith(
        "biz1",
        "rev1",
      );
      expect(toast.success).toHaveBeenCalledWith("Review deleted successfully");
      expect(adminService.getBusinessReviews).toHaveBeenCalledTimes(2);
    });
  });

  it("deletes a product review", async () => {
    adminService.getBusinessReviews.mockResolvedValue({
      data: mockBusinessReviews,
    });
    adminService.getProductReviews.mockResolvedValue({
      data: mockProductReviews,
    });
    adminService.deleteProductReview.mockResolvedValue({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const productTab = screen.getByRole("button", { name: /Product/i });
    fireEvent.click(productTab);

    await waitFor(() => {
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle("Delete Review");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(adminService.deleteProductReview).toHaveBeenCalledWith(
        "prod1",
        "prev1",
      );
      expect(toast.success).toHaveBeenCalledWith("Review deleted successfully");
    });
  });

  it("does not delete review if confirmation is cancelled", async () => {
    window.confirm = vi.fn().mockReturnValue(false);
    adminService.getBusinessReviews.mockResolvedValue({
      data: mockBusinessReviews,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByTitle("Delete Review");
    fireEvent.click(deleteBtns[0]);

    expect(adminService.deleteBusinessReview).not.toHaveBeenCalled();
  });

  it("handles error deleting a review", async () => {
    adminService.getBusinessReviews.mockResolvedValue({
      data: mockBusinessReviews,
    });
    adminService.deleteBusinessReview.mockRejectedValue(
      new Error("Delete error"),
    );
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByTitle("Delete Review");
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to delete review");
    });
  });

  it("navigates to analytics page", async () => {
    adminService.getBusinessReviews.mockResolvedValue({
      data: mockBusinessReviews,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const analyticsBtns = screen.getAllByTitle("View Business Analytics");
    fireEvent.click(analyticsBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Analytics Page")).toBeInTheDocument();
    });
  });

  it("filters reviews by rating", async () => {
    adminService.getBusinessReviews.mockResolvedValue({
      data: mockBusinessReviews,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const filterSelect = screen.getByRole("combobox");
    fireEvent.change(filterSelect, { target: { value: "5" } });

    await waitFor(() => {
      expect(adminService.getBusinessReviews).toHaveBeenCalledWith(
        expect.objectContaining({ rating: "5" }),
      );
    });
  });

  it("handles search and navigation for analytics", async () => {
    adminService.getBusinessReviews.mockResolvedValue({
      data: mockBusinessReviews,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Enter Business ID...");
    fireEvent.change(searchInput, { target: { value: "searchBiz123" } });

    const goBtn = screen.getByRole("button", { name: /Go/i });
    fireEvent.click(goBtn);

    await waitFor(() => {
      expect(screen.getByText("Analytics Page")).toBeInTheDocument();
    });
  });

  it("handles pagination correctly", async () => {
    adminService.getBusinessReviews.mockResolvedValue({
      data: mockBusinessReviews,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole("button", { name: /Next Page/i });
    // The previous/next buttons just contain icons, let's find them by text content or testid. Let's find the number 2
    const page2Btn = screen.getByRole("button", { name: "2" });
    fireEvent.click(page2Btn);

    await waitFor(() => {
      expect(adminService.getBusinessReviews).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  it("shows no reviews found state", async () => {
    adminService.getBusinessReviews.mockResolvedValue({
      data: { reviews: [], pages: 0 },
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("No reviews found")).toBeInTheDocument();
    });
  });
});
