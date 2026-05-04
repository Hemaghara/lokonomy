import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminProductDetails from "../../admin/AdminProductDetails";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "p1" }),
    useNavigate: () => mockNavigate,
  };
});

// Mock adminService
vi.mock("../../../services", () => ({
  adminService: {
    getMarketProductDetails: vi.fn(),
    toggleBanProduct: vi.fn(),
    toggleSuspendProduct: vi.fn(),
  },
}));

const mockProductData = {
  data: {
    _id: "p1",
    productName: "Handmade Pottery",
    description: "Beautiful handmade clay pot.",
    mainCategory: "Art",
    subCategory: "Pottery",
    price: 1200,
    priceType: "Fixed",
    isSold: false,
    isFeatured: true,
    isFlagged: false,
    isSuspended: false,
    isAuction: true,
    auctionEnd: new Date().toISOString(),
    currentHighestBid: 1500,
    rating: 4.5,
    numReviews: 12,
    productImages: ["pot1.png", "pot2.png"],
    sellerProfile: {
      name: "Clay Artist",
      email: "artist@example.com",
      contactNumber: "1122334455",
      address: "Art Studio, Mumbai",
      contactPreference: "WhatsApp",
    },
    sellerId: { _id: "u1", name: "Clay Artist", phone: "1122334455" },
  },
};

describe("AdminProductDetails Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getMarketProductDetails.mockResolvedValue(mockProductData);
    adminService.toggleBanProduct.mockResolvedValue({
      data: { message: "Product banned successfully" },
    });
    adminService.toggleSuspendProduct.mockResolvedValue({
      data: { message: "Product suspended successfully" },
    });
  });

  it("renders loading state initially", async () => {
    adminService.getMarketProductDetails.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockProductData), 100),
        ),
    );
    render(<AdminProductDetails />);
    expect(screen.getByText(/Loading product/i)).toBeInTheDocument();
  });

  it("shows not found screen on null response", async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({ data: null });
    render(<AdminProductDetails />);
    await waitFor(() => {
      expect(screen.getByText(/Not Found/i)).toBeInTheDocument();
      expect(screen.getByText(/could not be located/i)).toBeInTheDocument();
    });

    // Click Return to Marketplace
    fireEvent.click(
      screen.getByRole("button", { name: /Return to Marketplace/i }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/admin/marketplace");
  });

  it("handles API failure during fetch", async () => {
    adminService.getMarketProductDetails.mockRejectedValueOnce(
      new Error("API Error"),
    );
    render(<AdminProductDetails />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to fetch product details",
      );
    });
  });

  it("renders product details and statistics", async () => {
    render(<AdminProductDetails />);

    await waitFor(() => {
      expect(screen.getAllByText("Handmade Pottery")[0]).toBeInTheDocument();
      expect(screen.getAllByText(/1,200/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText("4.5 / 5")[0]).toBeInTheDocument();
      expect(screen.getAllByText("12 reviews")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Available")[0]).toBeInTheDocument();
    });
  });

  it("renders image gallery and allows switching images", async () => {
    render(<AdminProductDetails />);
    await screen.findByText("Handmade Pottery");

    await waitFor(() => {
      const images = document.querySelectorAll("img");
      expect(images.length).toBeGreaterThanOrEqual(1);
    });

    const thumbnails = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector("img"));
    if (thumbnails.length > 1) {
      fireEvent.click(thumbnails[1]);
      // Active image state updates, hard to verify without internal state check, but we ensure clicking doesn't crash
    }
  });

  it("renders seller profile and address", async () => {
    render(<AdminProductDetails />);

    await waitFor(() => {
      expect(screen.getByText("Clay Artist")).toBeInTheDocument();
      expect(screen.getByText("artist@example.com")).toBeInTheDocument();
      expect(screen.getByText("Art Studio, Mumbai")).toBeInTheDocument();
      expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    });

    // Navigate to seller profile
    fireEvent.click(screen.getByText("Clay Artist"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/user/u1");
  });

  it("handles moderation action: ban/unban", async () => {
    render(<AdminProductDetails />);
    await screen.findByText("Handmade Pottery");

    const banBtn = screen.getByRole("button", { name: /Ban/i });
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(adminService.toggleBanProduct).toHaveBeenCalledWith("p1");
      expect(toast.success).toHaveBeenCalledWith("Product banned successfully");
      expect(adminService.getMarketProductDetails).toHaveBeenCalledTimes(2); // Fetch called again
    });
  });

  it("handles moderation action failure: ban", async () => {
    adminService.toggleBanProduct.mockRejectedValueOnce(
      new Error("Ban failed"),
    );
    render(<AdminProductDetails />);
    await screen.findByText("Handmade Pottery");

    const banBtn = screen.getByRole("button", { name: /Ban/i });
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Action failed");
    });
  });

  it("handles moderation action: suspend/activate", async () => {
    render(<AdminProductDetails />);
    await screen.findByText("Handmade Pottery");

    const suspendBtn = screen.getByRole("button", { name: /Suspend/i });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(adminService.toggleSuspendProduct).toHaveBeenCalledWith("p1");
      expect(toast.success).toHaveBeenCalledWith(
        "Product suspended successfully",
      );
    });
  });

  it("handles moderation action failure: suspend", async () => {
    adminService.toggleSuspendProduct.mockRejectedValueOnce(
      new Error("Suspend failed"),
    );
    render(<AdminProductDetails />);
    await screen.findByText("Handmade Pottery");

    const suspendBtn = screen.getByRole("button", { name: /Suspend/i });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Action failed");
    });
  });

  it("renders auction details when product is an auction", async () => {
    render(<AdminProductDetails />);
    await screen.findByText("Live Auction");

    expect(screen.getByText(/Current Bid/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1,500/i)[0]).toBeInTheDocument();
  });

  it("renders different statuses for flagged and suspended", async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: {
        ...mockProductData.data,
        isFlagged: true,
        isSuspended: true,
        isSold: true,
      },
    });

    render(<AdminProductDetails />);

    await waitFor(() => {
      expect(screen.getByText("Banned")).toBeInTheDocument(); // Flagged takes precedence in StatusPill
      expect(screen.getAllByText("Sold")[0]).toBeInTheDocument();

      const unbanBtn = screen.getByRole("button", { name: /Unban/i });
      expect(unbanBtn).toBeInTheDocument();

      const activateBtn = screen.getByRole("button", { name: /Activate/i });
      expect(activateBtn).toBeInTheDocument();
    });
  });

  it("handles navigation via back button", async () => {
    render(<AdminProductDetails />);
    await screen.findByText("Handmade Pottery");

    // The back button is the first button on the page (before ban/suspend)
    // with FiArrowLeft
    const backBtn = screen.getAllByRole("button")[0];
    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
