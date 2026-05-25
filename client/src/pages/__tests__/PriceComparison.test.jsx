import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import PriceComparison from "../PriceComparison";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { priceComparisonService } from "../../services";
import { useLocation } from "../../context/LocationContext";

// Mock priceComparisonService
vi.mock("../../services", () => ({
  priceComparisonService: {
    comparePrices: vi.fn(),
  },
}));

// Mock useLocation
vi.mock("../../context/LocationContext", () => ({
  useLocation: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  };
});

const mockProducts = [
  {
    _id: "prod-1",
    productName: "Organic Milk 1L",
    price: 60,
    productImages: ["/milk.jpg"],
    business: {
      _id: "biz-1",
      businessName: "Amrut Dairy",
      rating: 4.5,
      district: "North Goa",
      taluka: "Mapusa",
      location: {
        coordinates: [73.8567, 15.5989], // [lon, lat] - Mapusa
      },
    },
  },
  {
    _id: "prod-2",
    productName: "Organic Milk 1L",
    price: 55, // Lowest price -> Best Deal
    productImages: ["/milk.jpg"],
    business: {
      _id: "biz-2",
      businessName: "Organic Farm Store",
      rating: 4.2,
      district: "North Goa",
      taluka: "Mapusa",
      location: {
        coordinates: [73.8500, 15.6000],
      },
    },
  },
];

describe("PriceComparison Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useLocation.mockReturnValue({
      coords: { lat: 15.5989, lng: 73.8567 }, // Mapusa coordinates
    });

    priceComparisonService.comparePrices.mockResolvedValue({
      data: { products: mockProducts },
    });
  });

  it("renders search input initially with help text", () => {
    render(<PriceComparison />);
    expect(screen.getByPlaceholderText(/What product are you looking for/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter a search query above/i)).toBeInTheDocument();
  });

  it("submits search form and displays matching products with Best Deal highlighting", async () => {
    render(<PriceComparison />);

    const searchInput = screen.getByPlaceholderText(/What product are you looking for/i);
    fireEvent.change(searchInput, { target: { value: "Milk" } });

    const compareBtn = screen.getByRole("button", { name: /Compare/i });
    fireEvent.click(compareBtn);

    expect(priceComparisonService.comparePrices).toHaveBeenCalledWith({ q: "Milk" });

    await waitFor(() => {
      expect(screen.getByText("Amrut Dairy")).toBeInTheDocument();
    });

    expect(screen.getByText("Organic Farm Store")).toBeInTheDocument();
    
    // Best Deal Badge check (only on Organic Farm Store, which is ₹55 compared to ₹60)
    expect(screen.getByText("💎 Best Deal")).toBeInTheDocument();
  });

  it("triggers comparison query when a category pill is clicked", async () => {
    render(<PriceComparison />);

    const groceryPill = screen.getByRole("button", { name: /Grocery/i });
    fireEvent.click(groceryPill);

    expect(priceComparisonService.comparePrices).toHaveBeenCalledWith({ category: "Grocery" });

    await waitFor(() => {
      expect(screen.getByText("Amrut Dairy")).toBeInTheDocument();
    });
  });

  it("calculates distance and displays it when location coords are present", async () => {
    render(<PriceComparison />);

    const groceryPill = screen.getByRole("button", { name: /Grocery/i });
    fireEvent.click(groceryPill);

    await waitFor(() => {
      expect(screen.getByText("Amrut Dairy")).toBeInTheDocument();
    });

    // Amrut Dairy has exact coordinates as user location -> 0.0 km away
    expect(screen.getByText("0.0 km away")).toBeInTheDocument();
  });

  it("sorts comparison items correctly", async () => {
    render(<PriceComparison />);

    const groceryPill = screen.getByRole("button", { name: /Grocery/i });
    fireEvent.click(groceryPill);

    await waitFor(() => {
      expect(screen.getByText("Amrut Dairy")).toBeInTheDocument();
    });

    // By default, sorting is price_asc, so Organic Farm Store (55) should be listed before Amrut Dairy (60)
    const items = screen.getAllByRole("heading", { level: 3 });
    // First heading is Organic Milk 1L, since they both have the same product name let's inspect parent text
    const productCards = screen.getAllByText("Organic Milk 1L").map(el => el.closest("div").parentElement);
    expect(productCards[0]).toHaveTextContent("Organic Farm Store");
    expect(productCards[1]).toHaveTextContent("Amrut Dairy");

    // Change Sort dropdown to Price: High to Low
    const sortDropdown = screen.getByRole("combobox");
    fireEvent.change(sortDropdown, { target: { value: "price_desc" } });

    // After sorting price_desc, Amrut Dairy (60) should be listed before Organic Farm Store (55)
    const productCardsDesc = screen.getAllByText("Organic Milk 1L").map(el => el.closest("div").parentElement);
    expect(productCardsDesc[0]).toHaveTextContent("Amrut Dairy");
    expect(productCardsDesc[1]).toHaveTextContent("Organic Farm Store");
  });

  it("handles empty results search view", async () => {
    priceComparisonService.comparePrices.mockResolvedValue({
      data: { products: [] },
    });

    render(<PriceComparison />);

    const searchInput = screen.getByPlaceholderText(/What product are you looking for/i);
    fireEvent.change(searchInput, { target: { value: "NonExistent" } });

    const compareBtn = screen.getByRole("button", { name: /Compare/i });
    fireEvent.click(compareBtn);

    await waitFor(() => {
      expect(screen.getByText("No products found")).toBeInTheDocument();
    });
  });
});
