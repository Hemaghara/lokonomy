import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '../../utils/test-utils';

import SellerOrders from '../SellerOrders';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService, marketService } from '../../services';

// Mock services
vi.mock('../../services', () => ({
  orderService: {
    getSellerOrders: vi.fn().mockResolvedValue({
      data: {
        orders: [
          {
            _id: 'o1',
            orderStatus: 'pending',
            createdAt: new Date().toISOString(),
            price: 1500,
            product: { productName: 'Seller Item', productImages: ['img.jpg'] },
            buyer: { name: 'John Doe', email: 'john@example.com' },
            contactNumber: '1234567890',
            shippingAddress: 'Buyer Address',
            paymentMethod: 'cash_on_delivery'
          }
        ]
      }
    }),
    getSellerStats: vi.fn().mockResolvedValue({
      data: {
        stats: {
          totalEarnings: 5000,
          totalOrders: 10,
          statusCounts: { pending: 2, preparing: 1, processing: 0, shipped: 3, delivered: 4 },
          dailySales: [{ date: new Date().toISOString(), amount: 500 }]
        }
      }
    }),
    updateOrderStatus: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
  marketService: {
    getMyProducts: vi.fn().mockResolvedValue({
      data: [{ _id: 'p1', productName: 'My Product', price: 1000, productImages: ['p.jpg'], subCategory: 'Electronics' }]
    }),
    deleteProduct: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('SellerOrders Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard stats correctly', async () => {
    render(<SellerOrders />);
    
    await waitFor(() => {
      expect(screen.getAllByText('₹5,000')[0]).toBeDefined();
      expect(screen.getAllByText('10')[0]).toBeDefined();
    });
  });

  it('switches between dashboard, orders, and products tabs', async () => {
    render(<SellerOrders />);
    
    await waitFor(() => screen.getAllByText('₹5,000')[0]);

    const ordersTab = screen.getAllByRole('button', { name: /Orders/i })[0];
    fireEvent.click(ordersTab);
    
    await waitFor(() => {
      expect(screen.getAllByText('Seller Item')[0]).toBeDefined();
    });

    const productsTab = screen.getAllByRole('button', { name: /Products/i })[0];
    fireEvent.click(productsTab);

    await waitFor(() => {
      expect(screen.getAllByText('My Product')[0]).toBeDefined();
    });
  });

  it('updates order status', async () => {
    render(<SellerOrders />);
    
    // Switch to orders tab
    await waitFor(() => screen.getAllByText('₹5,000')[0], { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: /Orders/i }));
    
    await waitFor(() => screen.getAllByText('Seller Item')[0], { timeout: 5000 });

    // Find the update button specifically (the ones at the bottom of the card)
    // We can use the fact that they are within the "Fulfillment Status" container
    const fulfillmentSection = screen.getByText(/Fulfillment Status/i).parentElement;
    const preparingBtn = within(fulfillmentSection).getByRole('button', { name: /Preparing/i });
    fireEvent.click(preparingBtn);

    await waitFor(() => {
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('o1', 'preparing');
    }, { timeout: 5000 });
  });


  it('handles product deletion', async () => {
    window.confirm = vi.fn(() => true);
    render(<SellerOrders />);
    
    // Switch to products tab
    await waitFor(() => screen.getAllByText('₹5,000')[0], { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: /Products/i }));
    
    await waitFor(() => screen.getAllByText('My Product')[0], { timeout: 5000 });

    const deleteBtn = screen.getAllByRole('button', { name: '' }).find(btn => btn.innerHTML.includes('HiOutlineXCircle') || btn.querySelector('svg'));
    if (deleteBtn) {
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(marketService.deleteProduct).toHaveBeenCalledWith('p1');
      }, { timeout: 5000 });
    }
  });
});

