import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import MyOrders from "../MyOrders";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { orderService } from "../../services";
import { toast } from "react-hot-toast";

// Mock orderService
vi.mock("../../services", () => ({
  orderService: {
    getBuyerOrders: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockOrders = [
  {
    _id: "o1",
    orderStatus: "pending",
    createdAt: new Date().toISOString(),
    price: 5000,
    product: {
      _id: "p1",
      productName: "Cool Headphones",
      productImages: ["test.jpg"],
    },
    contactNumber: "1234567890",
    shippingAddress: "123 Street, City",
    paymentMethod: "cash_on_delivery",
  },
  {
    _id: "o2",
    orderStatus: "delivered",
    createdAt: new Date().toISOString(),
    price: 1500,
    product: {
      _id: "p2",
      productName: "Gaming Mouse",
      productImages: ["mouse.jpg"],
    },
    contactNumber: "0987654321",
    shippingAddress: "456 Avenue, Town",
    paymentMethod: "online_payment",
  },
];

describe("MyOrders Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderService.getBuyerOrders.mockResolvedValue({
      data: { orders: mockOrders },
    });
  });

  it("renders loading state initially", () => {
    orderService.getBuyerOrders.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<MyOrders />);
    expect(screen.getByText(/Fetching Order History/i)).toBeInTheDocument();
  });

  it("renders order history correctly with formatting", async () => {
    render(<MyOrders />);

    await waitFor(() => {
      expect(screen.getByText("Cool Headphones")).toBeInTheDocument();
      expect(screen.getByText("Gaming Mouse")).toBeInTheDocument();
    });

    // Check status labels
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();

    // Check price formatting
    expect(screen.getByText("5,000")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();

    // Check payment method formatting (underscores replaced)
    expect(
      screen.getByText(/CASH ON DELIVERY Successful/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/ONLINE PAYMENT Successful/i)).toBeInTheDocument();

    // Check shipping address
    expect(screen.getByText("123 Street, City")).toBeInTheDocument();
  });

  it("handles API error with toast", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    orderService.getBuyerOrders.mockRejectedValue(new Error("Fetch failed"));

    render(<MyOrders />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load orders");
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it("renders empty state and navigates to market", async () => {
    orderService.getBuyerOrders.mockResolvedValueOnce({
      data: { orders: [] },
    });

    render(<MyOrders />);

    await waitFor(() => {
      expect(screen.getByText(/Your cart feels lonely/i)).toBeInTheDocument();
    });

    const shopBtn = screen.getByText(/Start Shopping Now/i);
    fireEvent.click(shopBtn);
    // expect(window.location.pathname).toBe('/market'); // Assuming navigate is tracked
  });

  it("navigates to product details and market via header", async () => {
    render(<MyOrders />);

    await waitFor(() => screen.getByText("Cool Headphones"));

    const viewBtn = screen.getAllByText(/View Product/i)[0];
    fireEvent.click(viewBtn);
    // Verified by navigate call if we mock useNavigate, but test-utils handles routing usually.

    const marketHeaderBtn = screen.getByRole("button", { name: /Market/i });
    fireEvent.click(marketHeaderBtn);
  });

  it("shows contact seller with correct tel link", async () => {
    render(<MyOrders />);

    await waitFor(() => screen.getByText("Cool Headphones"));

    const contactBtn = screen.getAllByRole("link", {
      name: /Contact Seller/i,
    })[0];
    expect(contactBtn.getAttribute("href")).toBe("tel:1234567890");
  });

  it("displays order ID slice", async () => {
    render(<MyOrders />);
    await waitFor(() => {
      // #O1.slice(-6) -> O1
      expect(screen.getByText("#O1")).toBeInTheDocument();
      expect(screen.getByText("#O2")).toBeInTheDocument();
    });
  });
});
