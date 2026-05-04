import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminAuctionDetails from "../../admin/AdminAuctionDetails";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../services", () => ({
  adminService: {
    getMarketProductDetails: vi.fn(),
    toggleBanProduct: vi.fn(),
    toggleSuspendProduct: vi.fn(),
  },
}));

vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "123" }),
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (ui) => {
  return render(ui);
};

describe("AdminAuctionDetails Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAuction = {
    _id: "123",
    productName: "Vintage Rolex",
    description: "A beautiful watch.",
    productImages: ["image1.jpg"],
    mainCategory: "Accessories",
    subCategory: "Watches",
    startingPrice: 5000,
    currentHighestBid: 5500,
    auctionEnd: new Date(Date.now() + 86400000).toISOString(), // Future
    isFlagged: false,
    isSuspended: false,
    sellerId: {
      _id: "seller1",
      name: "John Doe",
    },
    bids: [
      { userName: "Alice", amount: 5500, timestamp: new Date().toISOString() },
      { userName: "Bob", amount: 5200, timestamp: new Date().toISOString() },
    ],
  };

  it("renders loading state initially", () => {
    adminService.getMarketProductDetails.mockReturnValue(new Promise(() => {}));
    renderWithRouter(<AdminAuctionDetails />);
    expect(screen.getByText("Loading Auction Details...")).toBeInTheDocument();
  });

  it("renders not found state when auction is null", async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({ data: null });
    renderWithRouter(<AdminAuctionDetails />);

    await waitFor(() => {
      expect(screen.getByText("Auction Not Found")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Back to Marketplace"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/marketplace");
  });

  it("renders auction details successfully", async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: mockAuction,
    });
    renderWithRouter(<AdminAuctionDetails />);

    await waitFor(() => {
      expect(adminService.getMarketProductDetails).toHaveBeenCalledWith("123");
      expect(screen.getAllByText("Vintage Rolex")[0]).toBeInTheDocument();
      expect(screen.getAllByText(/₹5500/)[0]).toBeInTheDocument(); // Highest bid
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Highest")).toBeInTheDocument();
    });
  });

  it("handles auction with no bids", async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: { ...mockAuction, bids: [], currentHighestBid: null },
    });
    renderWithRouter(<AdminAuctionDetails />);

    await screen.findByText(/No bids have been placed yet/i);
    expect(screen.getAllByText(/₹5000/)[0]).toBeInTheDocument();
  });

  it("toggles ban status successfully", async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: mockAuction,
    });
    adminService.toggleBanProduct.mockResolvedValueOnce({
      data: { message: "Product banned" },
    });
    // For the refetch
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: { ...mockAuction, isFlagged: true },
    });

    renderWithRouter(<AdminAuctionDetails />);

    const banBtn = await screen.findByRole("button", { name: /Ban/i });
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(adminService.toggleBanProduct).toHaveBeenCalledWith("123");
      expect(toast.success).toHaveBeenCalledWith("Product banned");
      expect(screen.getByRole("button", { name: /Unban/i })).toBeInTheDocument();
    });
  });

  it("handles toggle ban failure", async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: mockAuction,
    });
    adminService.toggleBanProduct.mockRejectedValueOnce(new Error("Failed"));

    renderWithRouter(<AdminAuctionDetails />);

    const banBtn = await screen.findByRole("button", { name: /Ban/i });
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Action failed");
    });
  });

  it("toggles suspend status successfully", async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: mockAuction,
    });
    adminService.toggleSuspendProduct.mockResolvedValueOnce({
      data: { message: "Product suspended" },
    });

    renderWithRouter(<AdminAuctionDetails />);

    const suspendBtn = await screen.findByRole("button", { name: /Suspend/i });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(adminService.toggleSuspendProduct).toHaveBeenCalledWith("123");
      expect(toast.success).toHaveBeenCalledWith("Product suspended");
    });
  });

  it("handles toggle suspend failure", async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: mockAuction,
    });
    adminService.toggleSuspendProduct.mockRejectedValueOnce(
      new Error("Failed"),
    );

    renderWithRouter(<AdminAuctionDetails />);

    const suspendBtn = await screen.findByRole("button", { name: /Suspend/i });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Action failed");
    });
  });

  it("displays correct message if auction has ended", async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: { ...mockAuction, auctionEnd: pastDate },
    });
    renderWithRouter(<AdminAuctionDetails />);

    await waitFor(() => {
      expect(screen.getByText("Auction Ended On")).toBeInTheDocument();
    });
  });

  it("navigates to seller profile", async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: mockAuction,
    });
    renderWithRouter(<AdminAuctionDetails />);

    await waitFor(() => {
      expect(screen.getByText("View Seller Profile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("View Seller Profile"));

    expect(mockNavigate).toHaveBeenCalledWith("/admin/user/seller1");
  });

  it("handles fetch auction details failure", async () => {
    adminService.getMarketProductDetails.mockRejectedValueOnce(
      new Error("Failed"),
    );
    renderWithRouter(<AdminAuctionDetails />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to fetch auction details",
      );
    });
  });
});
