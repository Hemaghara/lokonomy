import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import MyOrders from '../MyOrders';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from '../../services';

// Mock orderService
vi.mock('../../services', () => ({
  orderService: {
    getBuyerOrders: vi.fn().mockResolvedValue({
      data: {
        orders: [
          {
            _id: 'o1',
            orderStatus: 'pending',
            createdAt: new Date().toISOString(),
            price: 5000,
            product: {
              _id: 'p1',
              productName: 'Cool Headphones',
              productImages: ['test.jpg']
            },
            contactNumber: '1234567890',
            shippingAddress: '123 Street, City',
            paymentMethod: 'cash_on_delivery'
          }
        ]
      }
    }),
  },
}));

describe('MyOrders Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders order history correctly', async () => {
    render(<MyOrders />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Cool Headphones')[0]).toBeDefined();
      expect(screen.getAllByText('Pending')[0]).toBeDefined();
      expect(screen.getAllByText('5,000')[0]).toBeDefined();
    });
  });

  it('renders empty state when no orders found', async () => {
    orderService.getBuyerOrders.mockResolvedValueOnce({
      data: { orders: [] }
    });

    render(<MyOrders />);
    
    await waitFor(() => {
      expect(screen.getByText(/Your cart feels lonely/i)).toBeDefined();
    });
  });

  it('navigates to product details', async () => {
    render(<MyOrders />);
    
    await waitFor(() => screen.getAllByText('Cool Headphones')[0]);

    const viewBtn = screen.getByText(/View Product/i);
    fireEvent.click(viewBtn);

    // Should navigate to product page
  });

  it('shows contact seller option', async () => {
    render(<MyOrders />);
    
    await waitFor(() => screen.getAllByText('Cool Headphones')[0]);

    const contactBtn = screen.getByRole('link', { name: /Contact Seller/i });
    expect(contactBtn.getAttribute('href')).toBe('tel:1234567890');
  });
});
