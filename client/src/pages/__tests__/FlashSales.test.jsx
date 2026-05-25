import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import FlashSales from "../FlashSales";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flashSaleService, businessService, marketService } from "../../services";

// Mock services
vi.mock("../../services", () => ({
  flashSaleService: {
    getFlashSales: vi.fn(),
    getSellerFlashSales: vi.fn(),
    createFlashSale: vi.fn(),
    cancelFlashSale: vi.fn(),
  },
  businessService: {
    getMyBusinesses: vi.fn(),
  },
  marketService: {
    getSellerProducts: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockActiveSales = [
  {
    _id: "sale-1",
    status: "active",
    originalPrice: 200,
    salePrice: 150,
    soldCount: 2,
    maxQuantity: 10,
    endTime: new Date(Date.now() + 3600000).toISOString(),
    productId: {
      _id: "prod-1",
      productName: "Premium Wireless Mouse",
      price: 200,
      productImages: ["/mouse.jpg"],
    },
    businessId: {
      _id: "biz-1",
      businessName: "Gizmo Shop",
      district: "North Goa",
    },
  },
];

const mockScheduledSales = [
  {
    _id: "sale-2",
    status: "scheduled",
    originalPrice: 500,
    salePrice: 350,
    soldCount: 0,
    maxQuantity: 5,
    startTime: new Date(Date.now() + 7200000).toISOString(),
    productId: {
      _id: "prod-2",
      productName: "Mechanical Keyboard",
      price: 500,
      productImages: ["/keyboard.jpg"],
    },
    businessId: {
      _id: "biz-1",
      businessName: "Gizmo Shop",
      district: "North Goa",
    },
  },
];

const mockSellerProducts = [
  {
    _id: "prod-1",
    productName: "Premium Wireless Mouse",
    price: 200,
  },
  {
    _id: "prod-2",
    productName: "Mechanical Keyboard",
    price: 500,
  },
];

describe("FlashSales Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock behavior
    flashSaleService.getFlashSales.mockResolvedValue({
      data: {
        active: mockActiveSales,
        scheduled: mockScheduledSales,
      },
    });
    businessService.getMyBusinesses.mockResolvedValue({ data: [] });
  });

  it("renders loading spinner initially", () => {
    render(<FlashSales />);
    expect(screen.getByText(/Loading Flash Deals.../i)).toBeInTheDocument();
  });

  it("renders active deals when loading finishes", async () => {
    render(<FlashSales />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Flash Deals.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("Premium Wireless Mouse")).toBeInTheDocument();
    expect(screen.getByText("Gizmo Shop")).toBeInTheDocument();
    expect(screen.getByText("North Goa")).toBeInTheDocument();
    expect(screen.getByText("Buy Deal Now")).toBeInTheDocument();
  });

  it("navigates to product detail page when Buy Deal Now is clicked", async () => {
    render(<FlashSales />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const buyBtn = screen.getByRole("button", { name: /Buy Deal Now/i });
    fireEvent.click(buyBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/market/product/prod-1");
  });

  it("switches to upcoming tab and displays scheduled deals", async () => {
    render(<FlashSales />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const upcomingTab = screen.getByRole("button", { name: /Coming Soon \(/i });
    fireEvent.click(upcomingTab);

    expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Coming Soon$/i })).toBeDisabled();
  });

  it("renders seller campaigns tab if user has a business", async () => {
    businessService.getMyBusinesses.mockResolvedValue({
      data: [{ _id: "biz-1", name: "Gizmo Shop" }],
    });
    flashSaleService.getSellerFlashSales.mockResolvedValue({
      data: { flashSales: mockActiveSales },
    });
    marketService.getSellerProducts.mockResolvedValue({
      data: { products: mockSellerProducts },
    });

    render(<FlashSales />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Verify campaign tab is rendered
    const campaignTab = screen.getByRole("button", { name: /My Campaigns/i });
    expect(campaignTab).toBeInTheDocument();

    fireEvent.click(campaignTab);

    // Cancel Deal button should appear
    expect(screen.getByRole("button", { name: /Cancel Deal/i })).toBeInTheDocument();
  });

  it("opens create flash sale modal, validates form, and submits successfully", async () => {
    businessService.getMyBusinesses.mockResolvedValue({
      data: [{ _id: "biz-1", name: "Gizmo Shop" }],
    });
    flashSaleService.getSellerFlashSales.mockResolvedValue({
      data: { flashSales: mockActiveSales },
    });
    marketService.getSellerProducts.mockResolvedValue({
      data: { products: mockSellerProducts },
    });
    flashSaleService.createFlashSale.mockResolvedValue({ data: { success: true } });

    render(<FlashSales />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const createBtn = screen.getByRole("button", { name: /Create Flash Sale/i });
    fireEvent.click(createBtn);

    // Modal elements check
    expect(screen.getByRole("heading", { name: /Start Flash Deal/i })).toBeInTheDocument();

    // Select Product
    const productSelect = screen.getByRole("combobox");
    fireEvent.change(productSelect, { target: { value: "prod-1" } });

    // Inputs
    const priceInput = screen.getByPlaceholderText(/e.g. 199/i);
    const qtyInput = screen.getByPlaceholderText(/e.g. 10/i);
    
    // Fill form
    fireEvent.change(priceInput, { target: { value: "120" } });
    fireEvent.change(qtyInput, { target: { value: "15" } });

    // Submitting form triggers validation: price must be less than original (200)
    // Price 120 is less than 200, so it's valid
    const dateInputs = document.querySelectorAll('input[type="datetime-local"]');
    const startTimeInput = dateInputs[0];
    const endTimeInput = dateInputs[1];
    
    fireEvent.change(startTimeInput, { target: { value: "2026-06-01T10:00" } });
    fireEvent.change(endTimeInput, { target: { value: "2026-06-01T14:00" } });

    const submitBtn = screen.getByRole("button", { name: /Launch Deal/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(flashSaleService.createFlashSale).toHaveBeenCalled();
    });
  });

  it("handles cancelling a flash sale campaign with window.confirm", async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    businessService.getMyBusinesses.mockResolvedValue({
      data: [{ _id: "biz-1", name: "Gizmo Shop" }],
    });
    flashSaleService.getSellerFlashSales.mockResolvedValue({
      data: { flashSales: mockActiveSales },
    });
    marketService.getSellerProducts.mockResolvedValue({
      data: { products: mockSellerProducts },
    });
    flashSaleService.cancelFlashSale.mockResolvedValue({ data: { success: true } });

    render(<FlashSales />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const campaignTab = screen.getByRole("button", { name: /My Campaigns/i });
    fireEvent.click(campaignTab);

    const cancelBtn = screen.getByRole("button", { name: /Cancel Deal/i });
    fireEvent.click(cancelBtn);

    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to cancel this flash sale?");
    expect(flashSaleService.cancelFlashSale).toHaveBeenCalledWith("sale-1");
  });
});
