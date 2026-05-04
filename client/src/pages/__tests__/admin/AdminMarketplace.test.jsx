import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminMarketplace from "../../admin/AdminMarketplace";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, custom, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

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
    getMarketProducts: vi.fn(),
    getMarketOrders: vi.fn(),
    getMarketAuctions: vi.fn(),
    getMarketStats: vi.fn(),
    toggleBanProduct: vi.fn(),
    toggleSuspendProduct: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockStatsData = {
  data: {
    activeProducts: 100,
    soldProducts: 50,
    bannedProducts: 5,
    suspendedProducts: 2,
  },
};

const mockProductsData = {
  data: {
    products: [
      {
        _id: "p1",
        productName: "Laptop",
        mainCategory: "Electronics",
        subCategory: "Computers",
        price: 50000,
        isSold: false,
        isFlagged: false,
        isSuspended: false,
        sellerProfile: { name: "Tech Store" },
        productImages: ["image.jpg"],
      },
    ],
    totalPages: 2,
  },
};

const mockOrdersData = {
  data: {
    orders: [
      {
        _id: "o1",
        product: { productName: "Laptop", productImages: [] },
        buyer: { name: "John Doe", email: "john@example.com" },
        price: 50000,
        orderStatus: "pending",
      },
    ],
    totalPages: 1,
  },
};

const mockAuctionsData = {
  data: {
    auctions: [
      {
        _id: "a1",
        productName: "Antique Vase",
        startingPrice: 1000,
        currentHighestBid: 1500,
        auctionEnd: new Date().toISOString(),
        productImages: [],
        bids: [
          { userName: "Alice", amount: 1200 },
          { userName: "Bob", amount: 1500 },
        ],
      },
    ],
    totalPages: 1,
  },
};

describe("AdminMarketplace Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    adminService.getMarketProducts.mockReturnValue(new Promise(() => {}));
    adminService.getMarketStats.mockReturnValue(new Promise(() => {}));
    render(<AdminMarketplace />);

    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    expect(screen.getByText("Loading products…")).toBeInTheDocument();
  });

  it("renders products tab by default with data", async () => {
    adminService.getMarketStats.mockResolvedValue(mockStatsData);
    adminService.getMarketProducts.mockResolvedValue(mockProductsData);

    render(<AdminMarketplace />);

    await waitFor(() => {
      expect(adminService.getMarketStats).toHaveBeenCalledTimes(1);
      expect(adminService.getMarketProducts).toHaveBeenCalledTimes(1);
    });

    // Stats
    expect(screen.getByText("100")).toBeInTheDocument(); // Active
    expect(screen.getByText("50")).toBeInTheDocument(); // Sold

    // Products
    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("Electronics · Computers")).toBeInTheDocument();
    expect(screen.getByText("Tech Store")).toBeInTheDocument();
  });

  it("handles product search and filter", async () => {
    adminService.getMarketStats.mockResolvedValue(mockStatsData);
    adminService.getMarketProducts.mockResolvedValue(mockProductsData);

    render(<AdminMarketplace />);
    await screen.findByText("Laptop");

    const searchInput = screen.getByPlaceholderText("Search products…");
    fireEvent.change(searchInput, { target: { value: "laptop" } });

    await waitFor(() => {
      expect(adminService.getMarketProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "laptop",
        }),
      );
    });

    const activeBtn = screen.getByRole("button", { name: /^active$/i });
    fireEvent.click(activeBtn);

    await waitFor(() => {
      expect(adminService.getMarketProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "active",
          page: 1,
        }),
      );
    });
  });

  it("switches to orders tab and fetches data", async () => {
    adminService.getMarketStats.mockResolvedValue(mockStatsData);
    adminService.getMarketProducts.mockResolvedValue(mockProductsData);
    adminService.getMarketOrders.mockResolvedValue(mockOrdersData);

    render(<AdminMarketplace />);
    await screen.findByText("Laptop");

    // Change to orders tab
    const ordersTabBtn = screen.getByRole("button", { name: /Orders/i });
    fireEvent.click(ordersTabBtn);

    await waitFor(() => {
      expect(adminService.getMarketOrders).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    // Order table headers
    expect(screen.getByText("Customer")).toBeInTheDocument();
  });

  it("handles order filters and date range", async () => {
    adminService.getMarketStats.mockResolvedValue(mockStatsData);
    adminService.getMarketOrders.mockResolvedValue(mockOrdersData);

    render(<AdminMarketplace />);
    // Initial fetch on mount (products)

    const ordersTabBtn = screen.getByRole("button", { name: /Orders/i });
    fireEvent.click(ordersTabBtn);
    await screen.findByText("John Doe");

    // Status filter
    const statusSelect = screen.getByRole("combobox");
    fireEvent.change(statusSelect, { target: { value: "delivered" } });

    await waitFor(() => {
      expect(adminService.getMarketOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "delivered",
        }),
      );
    });

    // Date filters
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: "2023-01-01" } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: "2023-01-31" } });

    await waitFor(() => {
      expect(adminService.getMarketOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: "2023-01-01",
          endDate: "2023-01-31",
        }),
      );
    });

    // Reset dates
    const resetBtn = screen.getByRole("button", { name: /Reset/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(adminService.getMarketOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: undefined,
          endDate: undefined,
        }),
      );
    });
  });

  it("switches to auctions tab and fetches data", async () => {
    adminService.getMarketStats.mockResolvedValue(mockStatsData);
    adminService.getMarketProducts.mockResolvedValue(mockProductsData);
    adminService.getMarketAuctions.mockResolvedValue(mockAuctionsData);

    render(<AdminMarketplace />);
    await screen.findByText("Laptop");

    const auctionsTabBtn = screen.getByRole("button", { name: /Auctions/i });
    fireEvent.click(auctionsTabBtn);

    await waitFor(() => {
      expect(adminService.getMarketAuctions).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("Antique Vase")).toBeInTheDocument();
    expect(screen.getByText("₹1000")).toBeInTheDocument(); // Starting price
    expect(screen.getByText("₹1500")).toBeInTheDocument(); // Top bid
    expect(screen.getByText("Alice")).toBeInTheDocument(); // Bidder
  });

  it("navigates to details pages correctly", async () => {
    adminService.getMarketStats.mockResolvedValue(mockStatsData);
    adminService.getMarketProducts.mockResolvedValue(mockProductsData);
    adminService.getMarketOrders.mockResolvedValue(mockOrdersData);
    adminService.getMarketAuctions.mockResolvedValue(mockAuctionsData);

    render(<AdminMarketplace />);
    await screen.findByText("Laptop");

    // View Product
    const viewProductBtn = screen.getByLabelText("View Product Details");
    fireEvent.click(viewProductBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/admin/marketplace/product/p1");

    // Go to orders
    fireEvent.click(screen.getByRole("button", { name: /Orders/i }));
    await screen.findByText("John Doe");

    // View Order
    const viewOrderBtn = screen.getByLabelText("View Order Details");
    fireEvent.click(viewOrderBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/admin/marketplace/order/o1");

    // Go to auctions
    fireEvent.click(screen.getByRole("button", { name: /Auctions/i }));
    await screen.findByText("Antique Vase");

    // View Auction
    const viewAuctionBtn = screen.getByRole("button", {
      name: /View Details/i,
    });
    fireEvent.click(viewAuctionBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/admin/marketplace/auction/a1");
  });

  it("handles product moderation actions", async () => {
    adminService.getMarketStats.mockResolvedValue(mockStatsData);
    adminService.getMarketProducts.mockResolvedValue(mockProductsData);
    adminService.toggleBanProduct.mockResolvedValue({
      data: { message: "Ban toggled" },
    });
    adminService.toggleSuspendProduct.mockResolvedValue({
      data: { message: "Suspend toggled" },
    });

    render(<AdminMarketplace />);
    await screen.findByText("Laptop");

    // Ban
    const banBtn = screen.getByLabelText("Ban Product");
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(adminService.toggleBanProduct).toHaveBeenCalledWith("p1");
      expect(toast.success).toHaveBeenCalledWith("Ban toggled");
      expect(adminService.getMarketProducts).toHaveBeenCalledTimes(2);
    });

    // Suspend
    const suspendBtn = screen.getByLabelText("Suspend Product");
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(adminService.toggleSuspendProduct).toHaveBeenCalledWith("p1");
      expect(toast.success).toHaveBeenCalledWith("Suspend toggled");
      expect(adminService.getMarketProducts).toHaveBeenCalledTimes(3);
    });
  });

  it("handles API errors gracefully", async () => {
    adminService.getMarketStats.mockRejectedValue(new Error("Stats error"));
    adminService.getMarketProducts.mockRejectedValue(
      new Error("Products error"),
    );

    render(<AdminMarketplace />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch products");
    });
    // Stats error just console.errors, so we just expect the component not to crash
    expect(screen.getByText("Marketplace")).toBeInTheDocument();
  });
});
