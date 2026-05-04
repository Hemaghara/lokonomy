import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import ProductDetails from "../ProductDetails";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { marketService, chatService } from "../../services";
import { toast } from "react-hot-toast";
import recommendationService from "../../services/recommendationService";

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "prod-1" }),
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Mock ALL services to prevent real API calls
vi.mock("../../services", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    marketService: {
      ...actual.marketService,
      getProductById: vi.fn().mockResolvedValue({
        data: {
          _id: "prod-1",
          productName: "Vintage Camera",
          description: "A beautiful vintage camera",
          price: 5000,
          mainCategory: "Electronics",
          subCategory: "Cameras",
          productImages: ["image1.jpg"],
          sellerProfile: { name: "John Doe", contactNumber: "9999999999" },
          isAuction: false,
          priceType: "sell",
          createdAt: new Date().toISOString(),
        },
      }),
      placeBid: vi.fn().mockResolvedValue({ data: { success: true } }),
      getProductReviews: vi.fn().mockResolvedValue({
        data: {
          success: true,
          reviews: [
            {
              _id: "r1",
              userName: "Charlie",
              rating: 5,
              comment: "Amazing drone!",
              createdAt: new Date().toISOString(),
            },
          ],
          reviewCount: 1,
          avgRating: 5,
        },
      }),
      addProductReview: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
    wishlistService: {
      ...actual.wishlistService,
      checkWishlistStatus: vi.fn().mockResolvedValue({ success: true, isSaved: false }),
      toggleWishlist: vi.fn().mockResolvedValue({ success: true, isSaved: true }),
    },
    chatService: {
      ...actual.chatService,
      getConversations: vi.fn(),
      getMessages: vi.fn().mockResolvedValue({
        data: { success: true, messages: [] },
      }),
      sendMessage: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
  };
});

vi.mock("../../services/recommendationService", () => ({
  default: {
    trackInteraction: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));


const mockProduct = {
  _id: "prod-1",
  productName: "Professional Drone",
  description: "High-end photography drone with 4K camera.",
  price: 75000,
  productImages: ["drone1.jpg", "drone2.jpg"],
  mainCategory: "Electronics",
  subCategory: "Drones",
  condition: "new",
  sellerId: "s1",
  sellerProfile: {
    _id: "s1",
    name: "Sky High Tech",
    rating: 4.8,
  },
  isAuction: true,
  startingPrice: 50000,
  currentHighestBid: 60000,
  bids: [
    {
      bidder: { name: "Alice" },
      amount: 55000,
      time: new Date().toISOString(),
    },
    { bidder: { name: "Bob" }, amount: 60000, time: new Date().toISOString() },
  ],
  auctionEnd: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
  reviews: [
    {
      _id: "r1",
      user: { name: "Charlie" },
      rating: 5,
      comment: "Amazing drone!",
      createdAt: new Date().toISOString(),
    },
  ],
  rating: 4.9,
  reviewCount: 1,
};

describe("ProductDetails Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    marketService.getProductById.mockResolvedValue({ data: mockProduct });
  });

  it("renders loading skeleton initially", async () => {
    marketService.getProductById.mockReturnValueOnce(new Promise(() => {})); // Never resolves
    render(<ProductDetails />);
    expect(screen.getByTestId("product-skeleton")).toBeInTheDocument();
  });


  it("handles image gallery interaction", async () => {
    render(<ProductDetails />);
    await waitFor(() => screen.getByAltText("Professional Drone"));

    const thumbnails = screen.getAllByRole("button", { name: /image/i });
    fireEvent.click(thumbnails[1]); // Click second image

    const mainImage = screen.getByTestId("main-image");
    expect(mainImage.getAttribute("src")).toContain("drone2.jpg");
  });

  it("switches between Description and Reviews tabs", async () => {
    render(<ProductDetails />);
    await waitFor(() => screen.getByText("Professional Drone"));

    const reviewsTab = screen.getByRole("button", { name: /Reviews/i });
    fireEvent.click(reviewsTab);

    await waitFor(() => {
      expect(screen.getByText("Charlie")).toBeDefined();
      expect(screen.getByText("Amazing drone!")).toBeDefined();
    });

    const descTab = screen.getByRole("button", { name: /Description/i });
    fireEvent.click(descTab);
    expect(
      screen.getByText("High-end photography drone with 4K camera."),
    ).toBeDefined();
  });

  it("handles placing a valid bid", async () => {
    marketService.placeBid.mockResolvedValue({
      data: {
        success: true,
        product: { ...mockProduct, currentHighestBid: 65000 },
      },
    });

    render(<ProductDetails />);
    await waitFor(() => screen.getByText("Professional Drone"));

    const bidInput = screen.getByPlaceholderText(/Min ₹60001/i);
    fireEvent.change(bidInput, { target: { value: "65000" } });

    const submitBidBtn = screen.getByRole("button", { name: /Place Bid/i });
    fireEvent.click(submitBidBtn);

    await waitFor(() => {
      expect(marketService.placeBid).toHaveBeenCalledWith("prod-1", {
        amount: 65000,
      });
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Bid placed successfully"),
      );
    });
  });

  it("prevents placing a bid lower than current high bid", async () => {
    render(<ProductDetails />);
    await waitFor(() => screen.getByText("Professional Drone"));

    const bidInput = screen.getByPlaceholderText(/Min ₹60001/i);
    fireEvent.change(bidInput, { target: { value: "55000" } }); // Lower than current 60000

    const submitBidBtn = screen.getByRole("button", { name: /Place Bid/i });
    fireEvent.click(submitBidBtn);

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Bid must be higher than current highest bid"),
    );
    expect(marketService.placeBid).not.toHaveBeenCalled();
  });

  it('renders "Auction Ended" UI when end date is past', async () => {
    const expiredProduct = {
      ...mockProduct,
      auctionEnd: new Date(Date.now() - 1000).toISOString(),
    };
    marketService.getProductById.mockResolvedValue({ data: expiredProduct });

    render(<ProductDetails />);
    await waitFor(() => screen.getByText("Professional Drone"));

    expect(screen.getByText(/Auction Ended/i)).toBeDefined();
    expect(screen.queryByPlaceholderText(/Min ₹/i)).toBeNull();
  });

  it('shows chat box when clicking "Chat with Seller"', async () => {
    render(<ProductDetails />);
    await waitFor(() => screen.getByText("Professional Drone"));

    const chatBtn = screen.getByRole("button", { name: /Chat with Seller/i });
    fireEvent.click(chatBtn);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Ask about the business/i),
      ).toBeDefined();
    });
  });

  it("handles review submission successfully", async () => {
    marketService.addProductReview.mockResolvedValue({
      data: { success: true },
    });

    marketService.getProductById.mockResolvedValue({
      data: { ...mockProduct, isSold: true },
    });
    marketService.getProductReviews.mockResolvedValue({
      data: { success: true, reviews: [], reviewCount: 0, avgRating: 0 },
    });

    render(<ProductDetails />);
    await waitFor(() => screen.getByText("Professional Drone"));

    // Switch to reviews tab
    fireEvent.click(screen.getByRole("button", { name: /Reviews/i }));

    await waitFor(() =>
      screen.getByPlaceholderText(/Your thoughts on this product/i),
    );

    const textArea = screen.getByPlaceholderText(
      /Your thoughts on this product/i,
    );
    fireEvent.change(textArea, { target: { value: "Excellent product!" } });

    // Select 5 stars
    const star5 = screen.getByLabelText("5 stars");
    fireEvent.click(star5);

    const submitReviewBtn = screen.getByRole("button", {
      name: /Post Review/i,
    });
    fireEvent.click(submitReviewBtn);

    await waitFor(() => {
      expect(marketService.addProductReview).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Product review added"),
      );
    });
  });

  it("shows error if product is not found", async () => {
    marketService.getProductById.mockResolvedValue({ data: null });

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.getByText(/Product not found/i)).toBeDefined();
    });
  });

  it("handles share button click", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<ProductDetails />);
    await waitFor(() => screen.getByText("Professional Drone"));

    const shareBtn = screen.getByRole("button", { name: /share/i });
    fireEvent.click(shareBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Link copied"),
    );
  });
});
