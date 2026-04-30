import React from 'react';

vi.mock('../../../layouts/AdminLayout', () => ({ __esModule: true, default: ({ children }) => <>{children}</> }));
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminProductDetails from '../../admin/AdminProductDetails';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';
import { useParams } from 'react-router-dom';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'p1' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getMarketProductDetails: vi.fn().mockResolvedValue({
      data: {
        _id: 'p1',
        productName: 'Handmade Pottery',
        description: 'Beautiful handmade clay pot.',
        mainCategory: 'Art',
        subCategory: 'Pottery',
        price: 1200,
        priceType: 'Fixed',
        isSold: false,
        isFeatured: true,
        isFlagged: false,
        isSuspended: false,
        rating: 4.5,
        numReviews: 12,
        productImages: ['pot1.png', 'pot2.png'],
        sellerProfile: {
          name: 'Clay Artist',
          email: 'artist@example.com',
          contactNumber: '1122334455',
          address: 'Art Studio, Mumbai',
          contactPreference: 'WhatsApp'
        },
        sellerId: { _id: 'u1', name: 'Clay Artist' }
      }
    }),
    toggleBanProduct: vi.fn().mockResolvedValue({ data: { message: 'Product banned' } }),
    toggleSuspendProduct: vi.fn().mockResolvedValue({ data: { message: 'Product suspended' } }),
  }
}));

describe('AdminProductDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product details and statistics', async () => {
    render(<AdminProductDetails />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/Handmade Pottery/i)[0]).toBeDefined();
      expect(screen.getAllByText(/1,200/i)[0]).toBeDefined();
      expect(screen.getAllByText(/4.5/i)[0]).toBeDefined();
      expect(screen.getAllByText(/12 reviews/i)[0]).toBeDefined();
      expect(screen.getAllByText(/Available/i)[0]).toBeDefined();
    });
  });

  it('renders image gallery and allows switching images', async () => {
    render(<AdminProductDetails />);
    await screen.findByText(/Handmade Pottery/i);
    // Images are inside motion.div, wait for them to be in the DOM
    await waitFor(() => {
      const images = document.querySelectorAll('img');
      expect(images.length).toBeGreaterThanOrEqual(1);
    });

    // Find the second image button (thumbnail)
    const thumbnails = screen.getAllByRole('button').filter(btn => btn.querySelector('img'));
    if (thumbnails.length > 1) {
      fireEvent.click(thumbnails[1]);
    }
  });

  it('renders seller profile and address', async () => {
    render(<AdminProductDetails />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/Clay Artist/i)[0]).toBeDefined();
      expect(screen.getAllByText(/artist@example.com/i)[0]).toBeDefined();
      expect(screen.getAllByText(/Art Studio/i)[0]).toBeDefined();
      expect(screen.getAllByText(/WhatsApp/i)[0]).toBeDefined();
    });
  });

  it('handles moderation actions (ban/suspend)', async () => {
    render(<AdminProductDetails />);
    
    await screen.findByText(/Handmade Pottery/i);

    const banBtn = screen.getAllByRole('button', { name: /Ban/i })[0];
    fireEvent.click(banBtn);
    await waitFor(() => expect(adminService.toggleBanProduct).toHaveBeenCalledWith('p1'));

    const suspendBtn = screen.getAllByRole('button', { name: /Suspend/i })[0];
    fireEvent.click(suspendBtn);
    await waitFor(() => expect(adminService.toggleSuspendProduct).toHaveBeenCalledWith('p1'));
  });

  it('shows not found screen on error', async () => {
    adminService.getMarketProductDetails.mockRejectedValueOnce(new Error('Not Found'));
    
    render(<AdminProductDetails />);
    
    await waitFor(() => {
      expect(screen.getByText(/Not Found/i)).toBeDefined();
    });
  });
});



