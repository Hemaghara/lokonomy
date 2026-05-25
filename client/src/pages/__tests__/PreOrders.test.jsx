import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import PreOrders from "../PreOrders";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { preOrderService, businessService } from "../../services";
import { useUser } from "../../context/UserContext";

// Mock services
vi.mock("../../services", () => ({
  preOrderService: {
    getBuyerPreOrders: vi.fn(),
    getSellerPreOrders: vi.fn(),
    updatePreOrderStatus: vi.fn(),
  },
  businessService: {
    getMyBusinesses: vi.fn(),
  },
}));

// Mock useUser
vi.mock("../../context/UserContext", () => ({
  useUser: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockBuyerPreOrders = [
  {
    _id: "preorder-1",
    status: "pending",
    quantity: 3,
    totalAmount: 1200,
    pickupDate: "2026-06-10T00:00:00.000Z",
    pickupTime: "14:00",
    notes: "Please pack nicely.",
    createdAt: "2026-05-25T10:00:00.000Z",
    productId: {
      _id: "prod-101",
      productName: "Chocolate Cake",
      productImages: ["/cake.jpg"],
    },
    sellerId: {
      name: "Delight Bakery",
      contactNumber: "9876543210",
    },
  },
];

const mockSellerPreOrders = [
  {
    _id: "preorder-2",
    status: "pending",
    quantity: 1,
    totalAmount: 500,
    pickupDate: "2026-06-12T00:00:00.000Z",
    pickupTime: "11:00",
    notes: "Leave at front desk if not around.",
    createdAt: "2026-05-25T11:00:00.000Z",
    productId: {
      _id: "prod-102",
      productName: "Fresh Bread",
      productImages: ["/bread.jpg"],
    },
    buyerId: {
      name: "Alice Runner",
      contactNumber: "9988776655",
    },
  },
];

describe("PreOrders Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useUser.mockReturnValue({
      user: { id: "user-1", name: "Buyer User" },
    });

    businessService.getMyBusinesses.mockResolvedValue({ data: [] });
    preOrderService.getBuyerPreOrders.mockResolvedValue({
      data: { preOrders: mockBuyerPreOrders },
    });
    preOrderService.getSellerPreOrders.mockResolvedValue({
      data: { preOrders: mockSellerPreOrders },
    });
  });

  it("redirects to login if user is not authenticated", () => {
    useUser.mockReturnValue({ user: null });
    render(<PreOrders />);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("renders loading spinner and loads buyer pre-orders if user has no business", async () => {
    render(<PreOrders />);

    expect(screen.getByText(/Loading Pre-Orders.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("Chocolate Cake")).toBeInTheDocument();
    expect(screen.getByText("3 units")).toBeInTheDocument();
    expect(screen.getByText("Delight Bakery")).toBeInTheDocument();
    expect(screen.getByText("9876543210")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel Request/i })).toBeInTheDocument();
  });

  it("renders seller tab by default if user has a business", async () => {
    businessService.getMyBusinesses.mockResolvedValue({
      data: [{ _id: "biz-1", businessName: "Delight Bakery" }],
    });

    render(<PreOrders />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Default active tab should be Received Requests (Seller)
    expect(screen.getByText("Fresh Bread")).toBeInTheDocument();
    expect(screen.getByText("1 units")).toBeInTheDocument();
    expect(screen.getByText("Alice Runner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reject/i })).toBeInTheDocument();
  });

  it("updates pre-order status to accepted and completed for seller", async () => {
    businessService.getMyBusinesses.mockResolvedValue({
      data: [{ _id: "biz-1", businessName: "Delight Bakery" }],
    });
    preOrderService.updatePreOrderStatus.mockResolvedValue({ data: { success: true } });

    const { rerender } = render(<PreOrders />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const acceptBtn = screen.getByRole("button", { name: /Accept/i });
    fireEvent.click(acceptBtn);

    expect(preOrderService.updatePreOrderStatus).toHaveBeenCalledWith("preorder-2", "accepted");
  });

  it("cancels a pre-order request for buyer", async () => {
    preOrderService.updatePreOrderStatus.mockResolvedValue({ data: { success: true } });

    render(<PreOrders />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole("button", { name: /Cancel Request/i });
    fireEvent.click(cancelBtn);

    expect(preOrderService.updatePreOrderStatus).toHaveBeenCalledWith("preorder-1", "cancelled");
  });

  it("renders empty state and navigates to market on click", async () => {
    preOrderService.getBuyerPreOrders.mockResolvedValue({
      data: { preOrders: [] },
    });

    render(<PreOrders />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("No pre-orders found")).toBeInTheDocument();

    const goMarketBtn = screen.getByRole("button", { name: /Go To Market/i });
    fireEvent.click(goMarketBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/market");
  });
});
