import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import Checkout from "../Checkout";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { marketService, orderService } from "../../services";
import api from "../../services/api";

// Use hoisted mocks for variables used in vi.mock
const { mockNavigate, mockToast } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "prod-1" }),
    useNavigate: () => mockNavigate,
  };
});

// Mock services
vi.mock("../../services", () => ({
  marketService: {
    getProductById: vi.fn(),
  },
  orderService: {
    createOrder: vi.fn(),
  },
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: mockToast,
  Toaster: () => null,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe("Checkout Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('lokonomy_user', JSON.stringify({ 
      id: 'buyer-1', 
      _id: 'buyer-1',
      name: 'Test User', 
      email: 'test@example.com',
      locationName: 'Home',
      phoneNumber: '123',
      plan: 'free'
    }));

    // Setup default successful product fetch
    marketService.getProductById.mockResolvedValue({
      data: {
        _id: "prod-1",
        productName: "Gaming Laptop",
        price: 75000,
        priceType: "sell",
        isSold: false,
        productImages: ["laptop.jpg"],
        sellerId: { _id: "seller-1", name: "Tech Store", upiId: "tech@upi" },
      },
    });

    // Mock api.post directly on the imported api object
    vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders checkout details and order summary", async () => {
    render(<Checkout />);

    await waitFor(() => {
      expect(screen.getAllByText("Gaming Laptop")[0]).toBeDefined();
      expect(screen.getAllByText(/75,000/)[0]).toBeDefined();
    });
  });

  it("applies a valid coupon", async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        code: "SAVE10",
        discount: 10,
        discountType: "percentage",
      },
    });

    render(<Checkout />);
    await waitFor(() => screen.getAllByText("Gaming Laptop")[0]);

    const couponInput = screen.getByPlaceholderText(/Enter code/i);
    fireEvent.change(couponInput, { target: { value: "SAVE10" } });

    const applyBtn = screen.getByRole("button", { name: /Apply/i });
    await waitFor(() => expect(applyBtn).not.toBeDisabled());
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Coupon applied!");
      expect(screen.getByText(/Discount Applied!/i)).toBeDefined();
      expect(screen.getAllByText(/67,500/)[0]).toBeDefined();
    });
  });

  it("handles invalid coupon", async () => {
    vi.spyOn(api, 'post').mockRejectedValueOnce({
      response: { data: { message: "Invalid code" } },
    });

    render(<Checkout />);
    await waitFor(() => screen.getAllByText("Gaming Laptop")[0]);

    const couponInput = screen.getByPlaceholderText(/Enter code/i);
    fireEvent.change(couponInput, { target: { value: "BADCODE" } });

    const applyBtn = screen.getByRole("button", { name: /Apply/i });
    await waitFor(() => expect(applyBtn).not.toBeDisabled());
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Invalid code");
    });
  });

  it("switches payment methods and shows details", async () => {
    render(<Checkout />);
    await waitFor(() => screen.getAllByText("Gaming Laptop")[0]);

    const bankBtn = screen.getByRole("button", { name: /Bank Transfer/i });
    fireEvent.click(bankBtn);
    expect(screen.getByText(/Bank Transfer Details/i)).toBeDefined();

    const upiBtn = screen.getByRole("button", { name: /UPI/i });
    fireEvent.click(upiBtn);
    expect(screen.getByText(/Pay directly to Tech Store/i)).toBeDefined();
  });

  it("submits the order successfully", async () => {
    orderService.createOrder.mockResolvedValueOnce({ data: { success: true } });

    render(<Checkout />);
    await waitFor(() => screen.getAllByText("Gaming Laptop")[0]);

    fireEvent.change(screen.getByPlaceholderText(/Enter payment reference/i), {
      target: { value: "TXN123" },
    });

    const confirmBtn = screen.getByRole("button", { name: /Confirm Order/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(orderService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: "TXN123",
          productId: "prod-1",
        }),
      );
      expect(mockToast.success).toHaveBeenCalledWith("Order placed successfully!");
      expect(mockNavigate).toHaveBeenCalledWith("/my-orders");
    });
  });

  it("handles sold product", async () => {
    marketService.getProductById.mockResolvedValueOnce({
      data: { _id: "prod-1", isSold: true },
    });

    render(<Checkout />);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "This product has already been sold.",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/market/product/prod-1");
    });
  });

  it("copies UPI ID to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    
    // Use vi.stubGlobal for cleaner navigator mock
    vi.stubGlobal('navigator', {
      clipboard: { writeText }
    });

    render(<Checkout />);
    await waitFor(() => screen.getAllByText("Gaming Laptop")[0]);

    const copyBtn = screen.getByText(/Copy UPI ID/i);
    fireEvent.click(copyBtn);

    expect(writeText).toHaveBeenCalledWith("tech@upi");
    expect(mockToast.success).toHaveBeenCalledWith("UPI ID Copied");
    
    vi.unstubAllGlobals();
  });
});
