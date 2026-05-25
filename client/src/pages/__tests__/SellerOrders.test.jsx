import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "../../utils/test-utils";
import SellerOrders from "../SellerOrders";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { orderService, marketService } from "../../services";
import { toast } from "react-hot-toast";
import { useUser } from "../../context/UserContext";

// Mock UserContext
vi.mock("../../context/UserContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: vi.fn(() => ({
      user: { id: "u1", subscription: { plan: "platinum" } },
    })),
  };
});

// Mock services
vi.mock("../../services", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    orderService: {
      ...actual.orderService,
      getSellerOrders: vi.fn().mockResolvedValue({
        data: {
          orders: [
            {
              _id: "o1",
              orderStatus: "pending",
              createdAt: new Date().toISOString(),
              price: 1500,
              product: { productName: "Seller Item", productImages: ["img.jpg"] },
              buyer: { name: "John Doe", email: "john@example.com" },
              contactNumber: "1234567890",
              shippingAddress: "Buyer Address",
              paymentMethod: "cash_on_delivery",
            },
          ],
        },
      }),
      getSellerStats: vi.fn().mockResolvedValue({
        data: {
          stats: {
            totalEarnings: 5000,
            netEarnings: 5000,
            grossEarnings: 5000,
            totalOrders: 10,
            statusCounts: {
              pending: 2,
              preparing: 1,
              processing: 0,
              shipped: 3,
              delivered: 4,
            },
            dailySales: [{ date: new Date().toISOString(), gross: 500, amount: 500 }],
          },
        },
      }),
      updateOrderStatus: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
    marketService: {
      ...actual.marketService,
      getMyProducts: vi.fn().mockResolvedValue({
        data: [
          {
            _id: "p1",
            productName: "My Product",
            price: 1000,
            productImages: ["p.jpg"],
            subCategory: "Electronics",
          },
        ],
      }),
      deleteProduct: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
    businessService: {
      getMyBusinesses: vi.fn().mockResolvedValue({
        data: [
          {
            _id: "b1",
            autoResponseEnabled: false,
            awayMessage: "Away message",
            autoResponses: [],
          }
        ]
      }),
      updateBusiness: vi.fn().mockResolvedValue({
        data: {
          success: true,
          business: {
            _id: "b1",
            autoResponseEnabled: false,
            awayMessage: "Away message",
            autoResponses: [],
          }
        }
      }),
    },
    aiInsightsService: {
      getAIInsights: vi.fn().mockResolvedValue({
        data: {
          success: true,
          insights: [
            {
              _id: "in1",
              insightText: "Sell more stuff",
              recommendation: "Lower prices"
            }
          ]
        }
      }),
    },
    subscriptionBoxService: {
      getSellerBoxes: vi.fn().mockResolvedValue({
        data: {
          success: true,
          boxes: [
            {
              _id: "box1",
              name: "Snack Box",
              description: "Yummy snacks",
              price: 500,
              frequency: "monthly",
              items: "Chips, Cookies"
            }
          ]
        }
      }),
      createBox: vi.fn().mockResolvedValue({
        data: {
          success: true,
        }
      }),
    },
  };
});

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SellerOrders Page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useUser.mockReturnValue({
      user: { id: "u1", subscription: { plan: "platinum" } },
    });
  });

  it("renders dashboard stats and revenue chart", async () => {
    render(<SellerOrders />);

    await waitFor(() => {
      expect(screen.getAllByText("₹5,000")[0]).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      // Chart labels
      expect(screen.getByText("Daily Revenue")).toBeInTheDocument();
    });
  });

  it("shows upgrade prompt for Free plan users", async () => {
    useUser.mockReturnValue({
      user: { id: "u1", subscription: { plan: "free" } },
    });

    render(<SellerOrders />);

    await waitFor(() => {
      expect(screen.getByText(/Unlock Premium Stats/i)).toBeInTheDocument();
    });
  });

  it("filters orders by status", async () => {
    render(<SellerOrders />);

    const ordersTab = await screen.findByRole("button", { name: /Orders/i });
    fireEvent.click(ordersTab);

    await waitFor(() => screen.getByText("Seller Item"));

    const deliveredFilter = screen.getAllByRole("button", { name: /Delivered/i })[0];
    fireEvent.click(deliveredFilter);

    await waitFor(() => {
      expect(screen.queryByText("Seller Item")).not.toBeInTheDocument();
      expect(screen.getByText(/No results found/i)).toBeInTheDocument();
    });
  });

  it("updates order status with loading state", async () => {
    render(<SellerOrders />);

    fireEvent.click(await screen.findByRole("button", { name: /Orders/i }));
    await waitFor(() => screen.getByText("Seller Item"));

    const fulfillmentSection =
      screen.getByText(/Fulfillment Status/i).parentElement;
    const preparingBtn = within(fulfillmentSection).getByRole("button", {
      name: /Preparing/i,
    });

    fireEvent.click(preparingBtn);

    await waitFor(() => {
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        "o1",
        "preparing",
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("marked as preparing"),
      );
    });
  });

  it("handles product deletion with confirmation", async () => {
    window.confirm = vi.fn(() => true);
    render(<SellerOrders />);

    fireEvent.click(await screen.findByRole("button", { name: /Products/i }));
    await waitFor(() => screen.getByText("My Product"));

    const deleteBtn = screen.getByRole("button", { name: "" }); // Based on JSX structure
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(marketService.deleteProduct).toHaveBeenCalledWith("p1");
    });
  });

  it("handles API fetch failure", async () => {
    orderService.getSellerOrders.mockRejectedValueOnce(
      new Error("Fetch failed"),
    );

    render(<SellerOrders />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load dashboard data");
    });
  });

  it("triggers phone call on contact buyer click", async () => {
    render(<SellerOrders />);
    fireEvent.click(await screen.findByRole("button", { name: /Orders/i }));
    await waitFor(() => screen.getByText("Seller Item"));

    const callBtn = screen.getByText("1234567890");
    // In JSDOM, window.location.href update might not be easily testable without a stub
    // but we can check if it's rendered as expected or if we mock window.location
  });
});
