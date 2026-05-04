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

  it('handles coupon deletion through toast confirmation', async () => {
    growthService.deleteCoupon.mockResolvedValue({ data: { success: true } });
    await act(async () => {
        render(<CouponManager businessId={businessId} />);
    });

    await waitFor(() => screen.getByText('SAVE20'));
    
    // Click delete on the first coupon
    const deleteButton = screen.getAllByTitle('Delete Coupon')[0];
    await act(async () => {
        fireEvent.click(deleteButton);
    });

    // The toast should be called with a component callback
    expect(toast).toHaveBeenCalled();
    const toastCalls = toast.mock.calls.filter(call => typeof call[0] === 'function');
    const ToastComponent = toastCalls[toastCalls.length - 1][0];
    
    // Render the toast content
    let toastScreen;
    await act(async () => {
      toastScreen = render(<ToastComponent id="test-toast" />);
    });

    // Click "Yes, Delete"
    await act(async () => {
        fireEvent.click(toastScreen.getByText('Yes, Delete'));
    });

    await waitFor(() => {
      expect(growthService.deleteCoupon).toHaveBeenCalledWith('c1');
      expect(toast.success).toHaveBeenCalledWith('Coupon deleted successfully');
    });
  });

  it('cancels coupon deletion through toast', async () => {
    await act(async () => {
        render(<CouponManager businessId={businessId} />);
    });

    await waitFor(() => screen.getByText('SAVE20'));
    
    // Click delete on the first coupon
    const deleteButton = screen.getAllByTitle('Delete Coupon')[0];
    await act(async () => {
        fireEvent.click(deleteButton);
    });

    const toastCalls = toast.mock.calls.filter(call => typeof call[0] === 'function');
    const ToastComponent = toastCalls[toastCalls.length - 1][0];
    
    let toastScreen;
    await act(async () => {
      toastScreen = render(<ToastComponent id="test-toast" />);
    });

    // Click "Cancel"
    await act(async () => {
        fireEvent.click(toastScreen.getByText('Cancel'));
    });

    // The dismiss function should be called on the toast
    expect(toast.dismiss).toHaveBeenCalledWith('test-toast');
    expect(growthService.deleteCoupon).not.toHaveBeenCalled();
  });

  it('verifies/redeems a coupon successfully', async () => {
    growthService.redeemCoupon.mockResolvedValue({ data: { message: 'Coupon redeemed successfully' } });
    await act(async () => {
        render(<CouponManager businessId={businessId} />);
    });

    const input = screen.getByPlaceholderText(/Enter Coupon Code/i);
    fireEvent.change(input, { target: { value: 'save20' } });
    expect(input.value).toBe('SAVE20'); // uppercase

    await act(async () => {
        fireEvent.click(screen.getByText('Redeem'));
    });

    await waitFor(() => {
        expect(growthService.redeemCoupon).toHaveBeenCalledWith({ code: 'SAVE20', businessId });
        expect(toast.success).toHaveBeenCalledWith('Coupon redeemed successfully');
    });
  });

  it('handles create coupon error gracefully', async () => {
    growthService.createCoupon.mockRejectedValue({ response: { data: { message: 'Duplicate code' } } });
    await act(async () => {
        render(<CouponManager businessId={businessId} />);
    });
    
    await act(async () => {
        fireEvent.click(screen.getByText(/New Coupon/i));
    });

    await waitFor(() => screen.getByText(/Create New Coupon/i));

    fireEvent.change(screen.getByPlaceholderText(/e.g. SAVE20/i), { target: { value: 'DUP' } });
    fireEvent.change(screen.getByPlaceholderText('20'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/Expiry Date/i), { target: { value: '2027-12-31' } });
    
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Coupon/i }));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Duplicate code');
    });
  });

  it('cancels the form', async () => {
    await act(async () => {
        render(<CouponManager businessId={businessId} />);
    });
    
    await act(async () => {
        fireEvent.click(screen.getByText(/New Coupon/i));
    });

    await waitFor(() => screen.getByText(/Create New Coupon/i));

    await act(async () => {
        // Find the generic 'Cancel' button or the close 'X'
        const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
        fireEvent.click(cancelBtn);
    });

    expect(screen.queryByText(/Create New Coupon/i)).not.toBeInTheDocument();
  });

  it('displays correct status labels', async () => {
    // Modify mock data to include a disabled coupon
    growthService.getCoupons.mockResolvedValueOnce({ 
        data: [
            ...mockCoupons,
            { _id: 'c3', code: 'LIMIT', discount: 10, discountType: 'fixed', expiryDate: '2027-01-01', usageLimit: 10, usedCount: 10, status: 'disabled' },
        ] 
    });

    await act(async () => {
        render(<CouponManager businessId={businessId} />);
    });
    await waitFor(() => {
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Expired').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Limit Reached').length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when no coupons exist', async () => {
    growthService.getCoupons.mockResolvedValueOnce({ data: [] });
    await act(async () => {
        render(<CouponManager businessId={businessId} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('No coupons yet. Create one to attract customers!')).toBeInTheDocument();
    });
  });
});
