import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminOrderDetails from "../../admin/AdminOrderDetails";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, custom, variants, ...rest } =
        props;
      return <div {...rest}>{children}</div>;
    },
    header: ({ children, ...props }) => {
      const { initial, animate, exit, transition, custom, variants, ...rest } =
        props;
      return <header {...rest}>{children}</header>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "order123" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../services", () => ({
  adminService: {
    getMarketOrderDetails: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    error: vi.fn(),
  },
}));

const mockOrderData = {
  data: {
    _id: "order123",
    price: 5000,
    orderStatus: "shipped",
    paymentMethod: "credit_card",
    transactionId: "txn_987654321",
    createdAt: new Date("2023-10-15T12:00:00Z").toISOString(),
    contactNumber: "1234567890",
    shippingAddress: "123 Main St, Cityville",
    product: {
      _id: "prod1",
      productName: "Premium Headphones",
      mainCategory: "Electronics",
      subCategory: "Audio",
      productImages: ["image1.jpg"],
    },
    buyer: {
      name: "John Buyer",
      email: "john@buyer.com",
    },
    seller: {
      name: "Tech Seller",
      email: "sales@techseller.com",
      mobile: "0987654321",
      location: { address: "Tech Park, Valley" },
    },
  },
};

describe("AdminOrderDetails Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    adminService.getMarketOrderDetails.mockReturnValue(new Promise(() => {}));
    render(<AdminOrderDetails />);
    expect(screen.getByText("Fetching Order Data…")).toBeInTheDocument();
  });

  it("renders not found state when order fetch fails", async () => {
    adminService.getMarketOrderDetails.mockRejectedValue(
      new Error("Fetch error"),
    );
    render(<AdminOrderDetails />);

    await screen.findByText("Order Not Found");
    expect(
      screen.getByText("This order may have been removed or doesn't exist."),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Failed to fetch order details");

    const backBtn = screen.getByRole("button", {
      name: /Back to Marketplace/i,
    });
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/admin/marketplace");
  });

  it("renders not found state when order is null", async () => {
    adminService.getMarketOrderDetails.mockResolvedValue({ data: null });
    render(<AdminOrderDetails />);

    await screen.findByText("Order Not Found");
  });

  it("renders order details correctly", async () => {
    adminService.getMarketOrderDetails.mockResolvedValue(mockOrderData);
    render(<AdminOrderDetails />);

    await screen.findByText("Premium Headphones");

    // Header
    expect(screen.getByText("#ORDER123")).toBeInTheDocument();
    expect(screen.getByText("shipped")).toBeInTheDocument();
    expect(screen.getByText(/Placed/)).toBeInTheDocument(); // Date string

    // Product Details
    expect(screen.getByText("Electronics • Audio")).toBeInTheDocument();
    expect(screen.getByText("prod1")).toBeInTheDocument();

    // Buyer Details
    expect(screen.getByText("John Buyer")).toBeInTheDocument();
    expect(screen.getByText("john@buyer.com")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(screen.getByText("123 Main St, Cityville")).toBeInTheDocument();

    // Seller Details
    expect(screen.getByText("Tech Seller")).toBeInTheDocument();
    expect(screen.getByText("sales@techseller.com")).toBeInTheDocument();
    expect(screen.getByText("0987654321")).toBeInTheDocument();
    expect(screen.getByText("Tech Park, Valley")).toBeInTheDocument();

    // Order Summary
    expect(screen.getAllByText("₹5000").length).toBeGreaterThan(0);
    expect(screen.getByText("credit card")).toBeInTheDocument();
    expect(screen.getByText("txn_987654321")).toBeInTheDocument();

    // Fulfillment
    expect(screen.getByText("Order Received")).toBeInTheDocument();
    expect(screen.getByText("Shipped")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    expect(screen.getByText("On the way…")).toBeInTheDocument();
  });

  it("handles navigation back via header button", async () => {
    adminService.getMarketOrderDetails.mockResolvedValue(mockOrderData);
    render(<AdminOrderDetails />);

    await screen.findByText("Premium Headphones");

    const backBtn = screen.getByRole("button", { name: /Go back/i });
    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("displays cancelled state correctly", async () => {
    const cancelledOrder = {
      data: {
        ...mockOrderData.data,
        orderStatus: "cancelled",
      },
    };
    adminService.getMarketOrderDetails.mockResolvedValue(cancelledOrder);
    render(<AdminOrderDetails />);

    await screen.findByText("Order was cancelled");
    // Top badge should be cancelled
    expect(screen.getAllByText("cancelled").length).toBeGreaterThan(0);
  });
});
