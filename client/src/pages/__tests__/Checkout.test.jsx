import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Checkout from '../Checkout';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { marketService, orderService } from '../../services';
import api from '../../services/api';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'prod-1' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock services
vi.mock('../../services', () => ({
  marketService: {
    getProductById: vi.fn().mockResolvedValue({
      data: {
        _id: 'prod-1',
        productName: 'Gaming Laptop',
        price: 75000,
        priceType: 'sell',
        isSold: false,
        productImages: ['laptop.jpg'],
        sellerId: { _id: 'seller-1', name: 'Tech Store', upiId: 'tech@upi' },
      }
    }),
  },
  orderService: {
    createOrder: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  }
}));

describe('Checkout Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders checkout details and order summary', async () => {
    render(<Checkout />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Gaming Laptop')[0]).toBeDefined();
      expect(screen.getAllByText(/75.?000/)[0]).toBeDefined();
    });
  });

  it('applies a valid coupon', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        coupon: { _id: 'c1', discountType: 'percentage', discountValue: 10 }
      }
    });

    render(<Checkout />);
    
    await waitFor(() => screen.getAllByText('Gaming Laptop')[0]);

    const couponInput = screen.getByPlaceholderText(/Enter code/i);
    fireEvent.change(couponInput, { target: { value: 'SAVE10' } });

    const applyBtn = screen.getAllByRole('button', { name: /Apply/i })[0];
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Discount Applied!/i)).toBeDefined();
      expect(screen.getAllByText(/67.?500/)[0]).toBeDefined(); // 75000 - 10%
    }, { timeout: 5000 });
  });

  it('switches payment methods', async () => {
    render(<Checkout />);
    
    await waitFor(() => screen.getAllByText('Gaming Laptop')[0], { timeout: 5000 });

    const bankBtn = screen.getAllByRole('button', { name: /Bank Transfer/i })[0];
    fireEvent.click(bankBtn);

    expect(screen.getByText(/Bank Transfer Details/i)).toBeDefined();
  });

  it('submits the order successfully', async () => {
    render(<Checkout />);
    
    await waitFor(() => screen.getAllByText('Gaming Laptop')[0], { timeout: 5000 });

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/House\/Flat No./i), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter payment reference/i), { target: { value: 'TXN123' } });

    const confirmBtn = screen.getAllByRole('button', { name: /Confirm Order/i })[0];
    fireEvent.submit(confirmBtn.closest('form'));

    await waitFor(() => {
      expect(orderService.createOrder).toHaveBeenCalledWith(expect.objectContaining({
        transactionId: 'TXN123',
        shippingAddress: '123 Test St'
      }));
    }, { timeout: 5000 });
  });
});


