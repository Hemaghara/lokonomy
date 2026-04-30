import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminReviews from '../../admin/AdminReviews';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getBusinessReviews: vi.fn().mockResolvedValue({
      data: {
        reviews: [
          {
            reviewId: 'r1',
            businessId: 'b1',
            userName: 'John Doe',
            businessName: 'Cafe One',
            rating: 5,
            comment: 'Great coffee!',
            createdAt: new Date().toISOString()
          }
        ],
        pages: 1
      }
    }),
    getProductReviews: vi.fn().mockResolvedValue({
      data: {
        reviews: [
          {
            reviewId: 'r2',
            productId: 'p1',
            userName: 'Jane Smith',
            productName: 'Laptop',
            rating: 4,
            comment: 'Good laptop',
            createdAt: new Date().toISOString()
          }
        ],
        pages: 1
      }
    }),
    deleteBusinessReview: vi.fn().mockResolvedValue({ data: { success: true } }),
    deleteProductReview: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('AdminReviews Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders business reviews by default', async () => {
    render(<AdminReviews />);
    
    const johnDoe = await screen.findByText(/John Doe/i);
    expect(johnDoe).toBeDefined();
    expect(screen.getAllByText(/Great coffee!/i)[0]).toBeDefined();
  });

  it('switches to product reviews tab', async () => {
    render(<AdminReviews />);
    
    await waitFor(() => screen.getAllByText('John Doe')[0]);

    const productTab = screen.getAllByRole('button', { name: /Product/i })[0];
    fireEvent.click(productTab);

    await waitFor(() => {
      expect(screen.getAllByText('Jane Smith')[0]).toBeDefined();
      expect(screen.getAllByText('Laptop')[0]).toBeDefined();
    });
  });

  it('handles review deletion', async () => {
    render(<AdminReviews />);
    
    await waitFor(() => screen.getAllByText('John Doe')[0]);

    const deleteBtn = screen.getByTitle('Delete Review');
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(adminService.deleteBusinessReview).toHaveBeenCalledWith('b1', 'r1');
    });
  });

  it('filters by rating', async () => {
    render(<AdminReviews />);
    
    await waitFor(() => screen.getAllByText('John Doe')[0]);

    const ratingSelect = screen.getByLabelText(/Filter by Rating/i);
    fireEvent.change(ratingSelect, { target: { value: '5' } });

    await waitFor(() => {
      expect(adminService.getBusinessReviews).toHaveBeenCalledWith(expect.objectContaining({
        rating: '5'
      }));
    });
  });
});

