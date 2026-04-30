import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Wishlist from '../Wishlist';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wishlistService } from '../../services';

// Mock wishlistService
vi.mock('../../services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    wishlistService: {
      getWishlist: vi.fn().mockResolvedValue({
        success: true,
        wishlist: {
          products: [
            { _id: 'p1', productName: 'Wishlist Product', price: 1000, productImages: ['p.jpg'] }
          ],
          businesses: [
            { _id: 'b1', businessName: 'Wishlist Business', subCategory: 'Retail', district: 'Ahmedabad' }
          ],
          jobs: [
            { _id: 'j1', position: 'Wishlist Job', salary: '20000', location: 'Remote', vacancies: 1 }
          ],
        }
      }),
      checkWishlistStatus: vi.fn().mockResolvedValue({ isSaved: true }),
      toggleWishlist: vi.fn().mockResolvedValue({ success: true, isSaved: true, message: 'Updated' }),
    },
  };
});

describe('Wishlist Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders products by default', async () => {
    render(<Wishlist />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Wishlist Product')[0]).toBeDefined();
    });
  });

  it('switches tabs correctly', async () => {
    render(<Wishlist />);
    
    await waitFor(() => screen.getAllByText('Wishlist Product')[0]);

    const businessTab = screen.getAllByRole('button', { name: /Businesses/i })[0];
    fireEvent.click(businessTab);

    await waitFor(() => {
      expect(screen.getAllByText('Wishlist Business')[0]).toBeDefined();
    });

    const jobTab = screen.getAllByRole('button', { name: /Jobs/i })[0];
    fireEvent.click(jobTab);

    await waitFor(() => {
      expect(screen.getAllByText('Wishlist Job')[0]).toBeDefined();
    });
  });

  it('renders empty states', async () => {
    wishlistService.getWishlist.mockResolvedValueOnce({
      success: true,
      wishlist: { products: [], businesses: [], jobs: [] }
    });

    render(<Wishlist />);
    
    await waitFor(() => {
      expect(screen.getByText(/No Saved Products/i)).toBeDefined();
    });
  });
});
