import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Market from '../Market';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock market service via main services barrel (how Market.jsx imports it)
vi.mock('../../services', () => ({
  marketService: {
    getProducts: vi.fn().mockResolvedValue({
      data: [
        { _id: '1', productName: 'Artisan Bread', price: 150, category: 'Food', description: 'Freshly baked', priceType: 'sell' },
        { _id: '2', productName: 'Coffee Beans', price: 450, category: 'Beverage', description: 'Dark roast', priceType: 'sell' },
      ],
    }),
  },
  wishlistService: {
    checkWishlistStatus: vi.fn().mockResolvedValue({ isWishlisted: false }),
    toggleWishlist: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Market Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the marketplace and fetches products', async () => {
    render(<Market />);
    
    // The heading in Market.jsx is "Marketplace" (not "Local Marketplace")
    expect(screen.getByText(/Marketplace/i)).toBeDefined();
    
    await waitFor(() => {
      expect(screen.getByText(/Artisan Bread/i)).toBeDefined();
      expect(screen.getByText(/Coffee Beans/i)).toBeDefined();
    });
  });

  it('searches for products via search input', async () => {
    render(<Market />);
    
    await waitFor(() => screen.getAllByText('Artisan Bread')[0]);

    const searchInput = screen.getByPlaceholderText(/Search products/i);
    fireEvent.change(searchInput, { target: { value: 'Bread' } });

    // Local filter should show Artisan Bread and hide Coffee Beans
    await waitFor(() => {
      expect(screen.getAllByText('Artisan Bread')[0]).toBeDefined();
    });
  });

  it('displays empty state when no products match search', async () => {
    render(<Market />);
    
    await waitFor(() => screen.getAllByText('Artisan Bread')[0]);

    const searchInput = screen.getByPlaceholderText(/Search products/i);
    fireEvent.change(searchInput, { target: { value: 'xyz_nonexistent_12345' } });

    await waitFor(() => {
      expect(screen.getByText(/No Products Found/i)).toBeDefined();
    });
  });
});
