import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminCoupons from "../../admin/AdminCoupons";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../services", () => ({
  adminService: {
    getCoupons: vi.fn(),
    createCoupon: vi.fn(),
    updateCoupon: vi.fn(),
    deleteCoupon: vi.fn(),
    toggleCouponStatus: vi.fn(),
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
    stats: {
      totalActive: 5,
      totalUsed: 150,
      totalExpired: 2,
    },
    coupons: [
      {
        _id: "c1",
        code: "SUMMER20",
        discount: 20,
        discountType: "percentage",
        usageLimit: 100,
        usedCount: 45,
        expiryDate: new Date(Date.now() + 86400000).toISOString(),
        status: "active",
        businessId: null,
      },
      {
        _id: "c2",
        code: "WELCOME500",
        discount: 500,
        discountType: "fixed",
        usageLimit: 50,
        usedCount: 50,
        expiryDate: new Date(Date.now() - 86400000).toISOString(),
        status: "inactive",
        businessId: { _id: "b1", name: "Tech Store" },
      },
    ],
  },
};

describe("AdminCoupons Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true); // Mock window.confirm
  });

  it("renders loading state initially", () => {
    adminService.getCoupons.mockReturnValue(new Promise(() => {}));
    render(<AdminCoupons />);
    expect(screen.getByText("Coupon Management")).toBeInTheDocument();
    // Assuming spinner is shown, we check for lack of content
    expect(screen.queryByText("SUMMER20")).not.toBeInTheDocument();
  });

  it("renders coupons and stats correctly", async () => {
    adminService.getCoupons.mockResolvedValue(mockData);
    render(<AdminCoupons />);

    await screen.findByText("SUMMER20");
    expect(screen.getByText("WELCOME500")).toBeInTheDocument();

    // Stats
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // Details
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("500₹")).toBeInTheDocument();
    expect(screen.getByText("Global")).toBeInTheDocument();
    expect(screen.getByText("Tech Store")).toBeInTheDocument();
    expect(screen.getByText("45 / 100")).toBeInTheDocument();
  });

  it("displays empty state when no coupons exist", async () => {
    adminService.getCoupons.mockResolvedValue({
      data: {
        stats: { totalActive: 0, totalUsed: 0, totalExpired: 0 },
        coupons: [],
      },
    });
    render(<AdminCoupons />);

    await screen.findByText("No coupons active");
  });

  it("handles fetch error", async () => {
    adminService.getCoupons.mockRejectedValue(new Error("Fetch error"));
    render(<AdminCoupons />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch coupons");
    });
  });

  it("opens and closes create coupon modal", async () => {
    adminService.getCoupons.mockResolvedValue(mockData);
    render(<AdminCoupons />);

    await screen.findByText("SUMMER20");

    const createBtn = screen.getByRole("button", { name: /Create Coupon/i });
    fireEvent.click(createBtn);

    expect(screen.getByText("Create New Coupon")).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText("Create New Coupon")).not.toBeInTheDocument();
  });

  it("handles creating a new coupon successfully", async () => {
    adminService.getCoupons.mockResolvedValue(mockData);
    adminService.createCoupon.mockResolvedValue({});
    render(<AdminCoupons />);

    await screen.findByText("SUMMER20");

    fireEvent.click(screen.getByRole("button", { name: /Create Coupon/i }));

    const codeInput = screen.getByLabelText(/Code/i);
    fireEvent.change(codeInput, { target: { value: "NEWYEAR" } });

    const discountInput = screen.getByLabelText(/Discount/i);
    fireEvent.change(discountInput, { target: { value: "25" } });

    const expiryInput = screen.getByLabelText(/Expiry Date/i);
    fireEvent.change(expiryInput, { target: { value: "2025-12-31" } });

    const submitBtn = screen.getByTestId("coupon-submit-btn");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminService.createCoupon).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "NEWYEAR",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Coupon created");
      expect(adminService.getCoupons).toHaveBeenCalledTimes(2);
    });
  });

  it("handles creating a coupon failure", async () => {
    adminService.getCoupons.mockResolvedValue(mockData);
    adminService.createCoupon.mockRejectedValue({
      response: { data: { message: "Code exists" } },
    });
    render(<AdminCoupons />);

    await screen.findByText("SUMMER20");

    fireEvent.click(screen.getByRole("button", { name: /Create Coupon/i }));

    const codeInput = screen.getByLabelText(/Code/i);
    fireEvent.change(codeInput, { target: { value: "NEWYEAR" } });

    const discountInput = screen.getByLabelText(/Discount/i);
    fireEvent.change(discountInput, { target: { value: "25" } });

    const expiryInput = screen.getByLabelText(/Expiry Date/i);
    fireEvent.change(expiryInput, { target: { value: "2025-12-31" } });

    fireEvent.click(screen.getByTestId("coupon-submit-btn"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Code exists");
    });
  });

  it("handles editing a coupon", async () => {
    adminService.getCoupons.mockResolvedValue(mockData);
    adminService.updateCoupon.mockResolvedValue({});
    render(<AdminCoupons />);

    await screen.findByText("SUMMER20");

    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    fireEvent.click(editBtns[0]); // Edit first coupon

    expect(screen.getByText("Edit Coupon")).toBeInTheDocument();

    const codeInput = screen.getByLabelText(/Code/i);
    expect(codeInput.value).toBe("SUMMER20");

    fireEvent.change(codeInput, { target: { value: "SUMMER25" } });
    fireEvent.click(screen.getByTestId("coupon-submit-btn"));

    await waitFor(() => {
      expect(adminService.updateCoupon).toHaveBeenCalledWith(
        "c1",
        expect.objectContaining({
          code: "SUMMER25",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Coupon updated");
    });
  });

  it("handles deleting a coupon with confirmation", async () => {
    adminService.getCoupons.mockResolvedValue(mockData);
    adminService.deleteCoupon.mockResolvedValue({});
    render(<AdminCoupons />);

    await screen.findByText("SUMMER20");

    const deleteBtns = screen.getAllByRole("button", { name: /Delete/i });
    fireEvent.click(deleteBtns[0]);

    expect(window.confirm).toHaveBeenCalledWith("Delete this coupon?");

    await waitFor(() => {
      expect(adminService.deleteCoupon).toHaveBeenCalledWith("c1");
      expect(toast.success).toHaveBeenCalledWith("Coupon deleted");
    });
  });

  it("handles toggling coupon status", async () => {
    adminService.getCoupons.mockResolvedValue(mockData);
    adminService.toggleCouponStatus.mockResolvedValue({});
    render(<AdminCoupons />);

    await screen.findByText("SUMMER20");

    const disableBtn = screen.getByRole("button", { name: /Disable/i });
    fireEvent.click(disableBtn);

    await waitFor(() => {
      expect(adminService.toggleCouponStatus).toHaveBeenCalledWith("c1");
      expect(toast.success).toHaveBeenCalledWith("Status updated");
    });
  });

  it("handles toggle status error", async () => {
    adminService.getCoupons.mockResolvedValue(mockData);
    adminService.toggleCouponStatus.mockRejectedValue(
      new Error("Update failed"),
    );
    render(<AdminCoupons />);

    await screen.findByText("SUMMER20");

    const disableBtn = screen.getByRole("button", { name: /Disable/i });
    fireEvent.click(disableBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
  });
});
