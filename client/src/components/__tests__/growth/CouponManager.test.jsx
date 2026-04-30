import { render, screen, fireEvent, waitFor, act } from '../../../utils/test-utils';
import CouponManager from '../../growth/CouponManager';
import { growthService } from '../../../services';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';

vi.mock('../../../services', () => ({
  growthService: {
    getCoupons: vi.fn(),
    createCoupon: vi.fn(),
    updateCoupon: vi.fn(),
    deleteCoupon: vi.fn(),
    redeemCoupon: vi.fn(),
  },
}));

vi.mock('react-hot-toast', async (importOriginal) => {
  const actual = await importOriginal();
  const mockToast = vi.fn((cb) => (typeof cb === 'function' ? cb({ id: 'toast123' }) : cb));
  mockToast.success = vi.fn();
  mockToast.error = vi.fn();
  mockToast.dismiss = vi.fn();
  return {
    ...actual,
    default: mockToast,
    toast: mockToast,
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('CouponManager Component', () => {
  const businessId = 'biz123';
  const mockCoupons = [
    { _id: 'c1', code: 'SAVE20', discount: 20, discountType: 'percentage', expiryDate: '2027-01-01', usageLimit: 100, usedCount: 10, status: 'active' },
    { _id: 'c2', code: 'OLD50', discount: 50, discountType: 'fixed', expiryDate: '2022-01-01', usageLimit: 50, usedCount: 50, status: 'expired' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    growthService.getCoupons.mockResolvedValue({ data: mockCoupons });
  });

  it('renders and fetches coupons on mount', async () => {
    await act(async () => {
        render(<CouponManager businessId={businessId} />);
    });
    await waitFor(() => {
      expect(growthService.getCoupons).toHaveBeenCalledWith(businessId);
    });
    expect(screen.getByText('SAVE20')).toBeInTheDocument();
  });

  it('opens create form and submits a new coupon', async () => {
    growthService.createCoupon.mockResolvedValue({ data: { success: true } });
    await act(async () => {
        render(<CouponManager businessId={businessId} />);
    });
    
    await act(async () => {
        fireEvent.click(screen.getByText(/New Coupon/i));
    });
    
    await waitFor(() => {
        expect(screen.getByText(/Create New Coupon/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/e.g. SAVE20/i), { target: { value: 'WELCOME' } });
    fireEvent.change(screen.getByPlaceholderText('20'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/Expiry Date/i), { target: { value: '2027-12-31' } });
    
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Coupon/i }));
    });

    await waitFor(() => {
      expect(growthService.createCoupon).toHaveBeenCalled();
    });
  });

  it('opens edit form and updates a coupon', async () => {
    growthService.updateCoupon.mockResolvedValue({ data: { success: true } });
    await act(async () => {
        render(<CouponManager businessId={businessId} />);
    });

    await waitFor(() => screen.getByText('SAVE20'));
    
    const editButton = screen.getAllByTitle('Edit Coupon')[0];
    await act(async () => {
        fireEvent.click(editButton);
    });

    await waitFor(() => {
        expect(screen.getByText(/Edit Coupon/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('SAVE20'), { target: { value: 'SAVE25' } });
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Update Coupon/i }));
    });

    await waitFor(() => {
      expect(growthService.updateCoupon).toHaveBeenCalled();
    });
  });

  it('displays correct status labels', async () => {
    await act(async () => {
        render(<CouponManager businessId={businessId} />);
    });
    await waitFor(() => {
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Expired').length).toBeGreaterThan(0);
    });
  });
});
