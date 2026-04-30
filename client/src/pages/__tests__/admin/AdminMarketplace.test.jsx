import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminMarketplace from '../../admin/AdminMarketplace';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getMarketProducts: vi.fn().mockResolvedValue({
      data: {
        products: [
          {
            _id: 'p1',
            productName: 'Gaming Laptop',
            mainCategory: 'Electronics',
            subCategory: 'Computers',
            price: 50000,
            sellerProfile: { name: 'Tech Store' },
            isSold: false,
            isFlagged: false,
            isSuspended: false,
            productImages: []
          }
        ],
        totalPages: 1
      }
    }),
    getMarketOrders: vi.fn().mockResolvedValue({
      data: {
        orders: [
          {
            _id: 'o1',
            product: { productName: 'Smartphone', productImages: [] },
            buyer: { name: 'Alice', email: 'alice@example.com' },
            price: 20000,
            orderStatus: 'pending'
          }
        ],
        totalPages: 1
      }
    }),
    getMarketAuctions: vi.fn().mockResolvedValue({
      data: {
        auctions: [
          {
            _id: 'a1',
            productName: 'Vintage Watch',
            startingPrice: 1000,
            currentHighestBid: 1500,
            auctionEnd: new Date(Date.now() + 86400000).toISOString(),
            bids: [{ userName: 'Bob', amount: 1500 }],
            productImages: []
          }
        ],
        totalPages: 1
      }
    }),
    getMarketStats: vi.fn().mockResolvedValue({
      data: {
        activeProducts: 50,
        soldProducts: 20,
        bannedProducts: 5,
        suspendedProducts: 2
      }
    }),
    toggleBanProduct: vi.fn().mockResolvedValue({ data: { message: 'Product updated' } }),
    toggleSuspendProduct: vi.fn().mockResolvedValue({ data: { message: 'Product updated' } }),
  }
}));

describe('AdminMarketplace Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders products by default', async () => {
    render(<AdminMarketplace />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Gaming Laptop')[0]).toBeDefined();
      expect(screen.getAllByText('50')[0]).toBeDefined(); // Active products stat
    });
  });

  it('switches to orders tab and displays orders', async () => {
    render(<AdminMarketplace />);
    
    await waitFor(() => screen.getAllByText('Gaming Laptop')[0]);

    const ordersTab = screen.getAllByRole('button', { name: /Orders/i })[0];
    fireEvent.click(ordersTab);

    await waitFor(() => {
      expect(screen.getAllByText('Smartphone')[0]).toBeDefined();
      expect(screen.getAllByText('Alice')[0]).toBeDefined();
    });
  });

  it('switches to auctions tab and displays auctions', async () => {
    render(<AdminMarketplace />);
    
    await waitFor(() => screen.getAllByText('Gaming Laptop')[0]);

    const auctionsTab = screen.getAllByRole('button', { name: /Auctions/i })[0];
    fireEvent.click(auctionsTab);

    await waitFor(() => {
      expect(screen.getAllByText('Vintage Watch')[0]).toBeDefined();
      expect(screen.getAllByText('₹1500')[0]).toBeDefined();
    });
  });

  it('handles product actions in products tab', async () => {
    render(<AdminMarketplace />);
    
    await waitFor(() => screen.getAllByText('Gaming Laptop')[0]);

    const banBtn = screen.getByTitle('Ban');
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(adminService.toggleBanProduct).toHaveBeenCalledWith('p1');
    });
  });
});

