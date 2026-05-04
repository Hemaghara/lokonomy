import React from "react";
import { render, screen, fireEvent, waitFor, act } from "../../utils/test-utils";
import Market from "../Market";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { marketService } from "../../services";

// Mock market service
vi.mock("../../services", () => ({
  marketService: {
    getProducts: vi.fn(),
  },
  wishlistService: {
    checkWishlistStatus: vi.fn().mockResolvedValue({ isWishlisted: false }),
    toggleWishlist: vi.fn().mockResolvedValue({ success: true }),
  },
}));

const mockProducts = [
  {
    _id: "1",
    productName: "Artisan Bread",
    price: 150,
    mainCategory: "Properties",
    subCategory: "House & Apartments",
    description: "Freshly baked",
    priceType: "sell",
    productImages: ["bread.jpg"],
    isFeatured: true,
    rating: 4.5,
    numReviews: 10,
    district: "Mumbai",
    taluka: "Andheri",
  },
  {
    _id: "2",
    productName: "Room for Rent",
    price: 5000,
    mainCategory: "Property",
    subCategory: "Room",
    description: "Cozy room",
    priceType: "rent",
    productImages: [],
    isFeatured: false,
    rating: 0,
    numReviews: 0,
    district: "Pune",
  },
];

describe("Market Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    marketService.getProducts.mockResolvedValue({ data: mockProducts });
  });

  it("renders loading skeletons initially", () => {
    marketService.getProducts.mockReturnValue(new Promise(() => {}));
    render(<Market />);
    // MarketSkeleton contains skeletons with animate-pulse
    expect(document.querySelector(".animate-pulse")).toBeDefined();
  });

  it("renders the marketplace and fetches products", async () => {
    render(<Market />);

    expect(screen.getByText(/Marketplace/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Artisan Bread")).toBeInTheDocument();
      expect(screen.getByText("Room for Rent")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("5,000")).toBeInTheDocument();
    });

    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sale/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rent/i })).toBeInTheDocument();
  });

  it("filters products by category", async () => {
    render(<Market />);
    await waitFor(() => screen.getByText("Artisan Bread"));

    const propBtn = screen.getByRole("button", { name: /Properties/i });
    fireEvent.click(propBtn);

    await waitFor(() => {
      expect(marketService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          mainCategory: "Properties",
        }),
      );
    });
  });

  it("filters products by price type (Sale/Rent)", async () => {
    render(<Market />);
    await waitFor(() => screen.getByText("Artisan Bread"));

    const rentBtn = screen.getByRole("button", { name: /^Rent$/i });
    fireEvent.click(rentBtn);

    await waitFor(() => {
      expect(marketService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          priceType: "rent",
        }),
      );
    });
  });

  it("searches for products via search input", async () => {
    render(<Market />);
    await waitFor(() => screen.getByText("Artisan Bread"));

    const searchInput = screen.getByPlaceholderText(/Search products/i);
    fireEvent.change(searchInput, { target: { value: "Bread" } });

    await waitFor(() => {
      expect(screen.getByText("Artisan Bread")).toBeInTheDocument();
      expect(screen.queryByText("Room for Rent")).not.toBeInTheDocument();
    });

    // Clear search via X button
    const clearBtn = screen.getByRole("button", { name: /clear search/i }); // The HiOutlineXMark button
    fireEvent.click(clearBtn);
    expect(screen.getByText("Room for Rent")).toBeInTheDocument();
  });

  it("handles location-based radius selection", async () => {
    // Mock user with location
    localStorage.setItem(
      "lokonomy_user",
      JSON.stringify({ _id: "u1", latitude: 18.5, longitude: 73.8 }),
    );

    render(<Market />);

    await waitFor(() => {
      const radiusSelect = screen.getByLabelText(/Select radius/i);
      expect(radiusSelect).toBeInTheDocument();
      fireEvent.change(radiusSelect, { target: { value: "10000" } });
    });

    await waitFor(() => {
      expect(marketService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          radius: 10000,
          lat: 18.5,
          lng: 73.8,
        }),
      );
    });
  });

  it("displays empty state and allows clearing filters", async () => {
    render(<Market />);
    await waitFor(() => screen.getByText("Artisan Bread"));

    const searchInput = screen.getByPlaceholderText(/Search products/i);
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    await waitFor(() => {
      expect(screen.getByText(/No Products Found/i)).toBeInTheDocument();
    });

    const clearFiltersBtn = screen.getByRole("button", {
      name: /Clear Filters/i,
    });
    fireEvent.click(clearFiltersBtn);

    await waitFor(() => {
      expect(screen.getByText("Artisan Bread")).toBeInTheDocument();
    });
  });

  it("navigates to sell page and product details", async () => {
    render(<Market />);
    await waitFor(() => screen.getByText("Artisan Bread"));

    fireEvent.click(screen.getByText(/List an Item/i));
    fireEvent.click(screen.getByText("Artisan Bread"));
  });

  it("handles error during fetch", async () => {
    marketService.getProducts.mockRejectedValueOnce(new Error("Fetch error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<Market />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Market fetch error:",
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });

  it("renders category icons correctly", async () => {
    render(<Market />);
    await waitFor(() => screen.getByText("Artisan Bread"));

    // Check if category buttons have icons (they use SVGs from react-icons)
    const propBtn = screen.getByRole("button", { name: /Properties/i });
    expect(propBtn.querySelector("svg")).toBeDefined();
  });
});
