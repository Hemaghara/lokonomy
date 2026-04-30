import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminCoupons from '../../admin/AdminCoupons';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getCoupons: vi.fn().mockResolvedValue({
      data: {
        coupons: [
          {
            _id: 'c1',
            code: 'SAVE10',
            discount: 10,
            discountType: 'percentage',
            status: 'active',
            usedCount: 5,
            usageLimit: 100,
            expiryDate: new Date().toISOString(),
            businessId: { name: 'Bakery A', _id: 'b1' }
          }
        ],
        stats: { totalActive: 1, totalUsed: 5, totalExpired: 0 }
      }
    }),
    createCoupon: vi.fn().mockResolvedValue({ data: { success: true } }),
    updateCoupon: vi.fn().mockResolvedValue({ data: { success: true } }),
    deleteCoupon: vi.fn().mockResolvedValue({ data: { success: true } }),
    toggleCouponStatus: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('AdminCoupons Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders coupons list and stats', async () => {
    render(<AdminCoupons />);
    
    await waitFor(() => {
      expect(screen.getAllByText('SAVE10')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Active Coupons')[0]).toBeInTheDocument();
      expect(screen.getAllByText('1')[0]).toBeInTheDocument();
    });
  });

  it('handles coupon creation', async () => {
    render(<AdminCoupons />);
    
    const openModalBtn = screen.getAllByRole('button', { name: /Create Coupon/i })[0];
    fireEvent.click(openModalBtn);

    const codeInput = screen.getByLabelText(/Code/i);
    const discountInput = screen.getByLabelText(/Discount/i);
    const expiryInput = screen.getByLabelText(/Expiry Date/i);
    const limitInput = screen.getByLabelText(/Usage Limit/i);
    
    fireEvent.change(codeInput, { target: { value: 'NEW20' } });
    fireEvent.change(discountInput, { target: { value: '20' } });
    fireEvent.change(expiryInput, { target: { value: '2025-12-31' } });
    fireEvent.change(limitInput, { target: { value: '50' } });

    const submitBtn = screen.getByTestId('coupon-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminService.createCoupon).toHaveBeenCalledWith(expect.objectContaining({
        code: 'NEW20'
      }));
    });
  });

  it('handles status toggle', async () => {
    render(<AdminCoupons />);
    
    await waitFor(() => screen.getAllByText('SAVE10')[0]);

    const toggleBtn = screen.getAllByRole('button', { name: /Disable/i })[0];
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(adminService.toggleCouponStatus).toHaveBeenCalledWith('c1');
    });
  });

  it('handles coupon deletion', async () => {
    render(<AdminCoupons />);
    
    await waitFor(() => screen.getAllByText('SAVE10')[0]);

    const deleteBtn = screen.getAllByRole('button', { name: /Delete/i })[0];
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(adminService.deleteCoupon).toHaveBeenCalledWith('c1');
    });
  });

  it('opens edit modal with coupon data', async () => {
    render(<AdminCoupons />);
    
    await waitFor(() => screen.getAllByText('SAVE10')[0]);

    const editBtn = screen.getAllByRole('button', { name: /Edit/i })[0];
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue('SAVE10')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });
  });
});
