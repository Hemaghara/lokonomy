import { render, screen, fireEvent, waitFor, act } from '../../../utils/test-utils';
import BookingSystem from '../../growth/BookingSystem';
import { growthService } from '../../../services';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';

vi.mock('../../../services', () => ({
  growthService: {
    getBookings: vi.fn(),
    getActiveCoupons: vi.fn(),
    validateCoupon: vi.fn(),
    createBooking: vi.fn(),
    updateBookingStatus: vi.fn(),
  },
}));

vi.mock('react-hot-toast', async (importOriginal) => {
  const actual = await importOriginal();
  const mockToast = vi.fn();
  mockToast.success = vi.fn();
  mockToast.error = vi.fn();
  return {
    ...actual,
    default: mockToast,
    toast: mockToast,
  };
});

vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    on: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('BookingSystem Component', () => {
  const businessId = 'biz123';
  const ownerId = 'owner456';
  const mockBookings = [
    { _id: 'b1', serviceName: 'Haircut', userName: 'Alice', date: '2023-10-01', timeSlot: '10:00 AM', status: 'pending', isOwnerSelf: false },
    { _id: 'b2', serviceName: 'Shave', userName: 'Bob', date: '2023-10-02', timeSlot: '11:00 AM', status: 'confirmed', isOwnerSelf: true },
  ];
  const mockCoupons = [
    { _id: 'c1', code: 'SAVE10', discount: 10, discountType: 'percentage', expiryDate: '2025-01-01', spotsLeft: 5, alreadyUsed: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    growthService.getBookings.mockResolvedValue({ data: mockBookings });
    growthService.getActiveCoupons.mockResolvedValue({ data: mockCoupons });
  });

  it('renders and fetches bookings on mount', async () => {
    await act(async () => {
        render(<BookingSystem businessId={businessId} isOwner={true} ownerId={ownerId} />);
    });
    await waitFor(() => {
      expect(growthService.getBookings).toHaveBeenCalledWith(businessId);
    });
    expect(screen.getByText('Haircut')).toBeInTheDocument();
  });

  it('renders owner-specific elements', async () => {
    await act(async () => {
        render(<BookingSystem businessId={businessId} isOwner={true} ownerId={ownerId} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Incoming Requests/i)).toBeInTheDocument();
    });
  });

  it('renders customer-specific elements', async () => {
    growthService.getBookings.mockResolvedValueOnce({ data: [] });
    await act(async () => {
        render(<BookingSystem businessId={businessId} isOwner={false} ownerId={ownerId} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/Book New Appointment/i)).toBeInTheDocument();
      expect(growthService.getActiveCoupons).toHaveBeenCalledWith(businessId);
    });
  });

  it('opens booking modal and submits a new booking', async () => {
    growthService.getBookings.mockResolvedValueOnce({ data: [] });
    growthService.createBooking.mockResolvedValue({ data: { success: true } });
    await act(async () => {
        render(<BookingSystem businessId={businessId} isOwner={false} ownerId={ownerId} />);
    });
    
    await waitFor(() => screen.getByText(/Book New Appointment/i));
    await act(async () => {
        fireEvent.click(screen.getByText(/Book New Appointment/i));
    });

    await waitFor(() => {
        expect(screen.getByText(/Schedule Visit/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/e.g. Full Hair Grooming/i), { target: { value: 'Nail Art' } });
    fireEvent.change(screen.getByLabelText(/Date/i), { target: { value: '2027-11-01' } });
    fireEvent.change(screen.getByLabelText(/Time/i), { target: { value: '14:00' } });
    
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Confirm Booking/i }));
    });

    await waitFor(() => {
      expect(growthService.createBooking).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Booking request sent successfully!');
    });
  });

  it('allows owner to update booking status (approve/reject)', async () => {
    growthService.updateBookingStatus.mockResolvedValue({ data: { success: true } });
    await act(async () => {
        render(<BookingSystem businessId={businessId} isOwner={true} ownerId={ownerId} />);
    });

    await waitFor(() => screen.getByTitle('Approve'));
    
    // Test Approve
    await act(async () => {
        fireEvent.click(screen.getByTitle('Approve'));
    });
    expect(growthService.updateBookingStatus).toHaveBeenCalledWith({ bookingId: 'b1', status: 'confirmed' });
    expect(toast.success).toHaveBeenCalledWith('Appointment Approved');

    // Test Reject
    await act(async () => {
        fireEvent.click(screen.getByTitle('Reject'));
    });
    expect(growthService.updateBookingStatus).toHaveBeenCalledWith({ bookingId: 'b1', status: 'cancelled' });
    expect(toast.success).toHaveBeenCalledWith('Appointment Cancelled');
  });

  it('shows empty state for owner when no bookings', async () => {
    growthService.getBookings.mockResolvedValueOnce({ data: [] });
    await act(async () => {
        render(<BookingSystem businessId={businessId} isOwner={true} ownerId={ownerId} />);
    });
    await waitFor(() => {
      expect(screen.getByText('No appointment requests yet.')).toBeInTheDocument();
    });
  });

  it('prevents customer from booking if they have an active booking', async () => {
    // User has pending/confirmed booking
    await act(async () => {
        render(<BookingSystem businessId={businessId} isOwner={false} ownerId={ownerId} />);
    });
    await waitFor(() => {
      expect(screen.getByText('Request Under Review')).toBeInTheDocument();
      expect(screen.getByText('Only one active request allowed per business.')).toBeInTheDocument();
    });

    // Button should be disabled
    const button = screen.getByText('Request Under Review').closest('button');
    expect(button).toBeDisabled();
    
    // Simulate click just in case
    await act(async () => {
      fireEvent.click(button);
    });
    expect(toast.error).not.toHaveBeenCalled(); // Since it's disabled, no toast
  });

  it('allows customer to apply a coupon from available list', async () => {
    growthService.getBookings.mockResolvedValueOnce({ data: [] });
    growthService.validateCoupon.mockResolvedValue({ data: { code: 'SAVE10', discount: 10, discountType: 'percentage' } });
    
    await act(async () => {
        render(<BookingSystem businessId={businessId} isOwner={false} ownerId={ownerId} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/SAVE10/i)).toBeInTheDocument();
    });

    await act(async () => {
        fireEvent.click(screen.getByText(/Book New Appointment/i));
    });

    await waitFor(() => screen.getByText(/Pick from available coupons/i));
    
    // Open coupon list
    await act(async () => {
      fireEvent.click(screen.getByText(/Pick from available coupons/i));
    });
    
    // Click on the SAVE10 coupon from the dropdown list
    await act(async () => {
      // Multiple instances might exist (one outside modal, one inside list). Using all and clicking the one in list
      const codes = screen.getAllByText('SAVE10');
      fireEvent.click(codes[codes.length - 1]);
    });

    await waitFor(() => {
      expect(growthService.validateCoupon).toHaveBeenCalledWith({ code: 'SAVE10', businessId });
      expect(toast.success).toHaveBeenCalledWith('Coupon "SAVE10" applied!');
    });
    
    // Coupon should be selected
    expect(screen.getByText('10% discount applied')).toBeInTheDocument();
  });

  it('allows customer to apply coupon manually and then remove it', async () => {
    growthService.getBookings.mockResolvedValueOnce({ data: [] });
    growthService.validateCoupon.mockResolvedValue({ data: { code: 'CUSTOM20', discount: 20, discountType: 'fixed' } });
    
    await act(async () => {
        render(<BookingSystem businessId={businessId} isOwner={false} ownerId={ownerId} />);
    });

    await act(async () => {
        fireEvent.click(screen.getByText(/Book New Appointment/i));
    });

    await waitFor(() => screen.getByPlaceholderText(/Enter coupon code/i));
    const input = screen.getByPlaceholderText(/Enter coupon code/i);
    
    fireEvent.change(input, { target: { value: 'custom20' } });
    expect(input.value).toBe('CUSTOM20'); // Should uppercase

    await act(async () => {
      fireEvent.click(screen.getByText('Apply'));
    });

    await waitFor(() => {
      expect(growthService.validateCoupon).toHaveBeenCalledWith({ code: 'CUSTOM20', businessId });
      expect(screen.getByText('₹20 off applied')).toBeInTheDocument();
    });

    // Now remove it
    const closeBtn = screen.getByLabelText('Remove coupon');
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByText('₹20 off applied')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter coupon code/i)).toBeInTheDocument();
  });

  it('handles invalid coupon gracefully', async () => {
    growthService.getBookings.mockResolvedValueOnce({ data: [] });
    growthService.validateCoupon.mockRejectedValue({ response: { data: { message: 'Coupon expired' } } });
    
    await act(async () => {
        render(<BookingSystem businessId={businessId} isOwner={false} ownerId={ownerId} />);
    });

    await act(async () => {
        fireEvent.click(screen.getByText(/Book New Appointment/i));
    });

    await waitFor(() => screen.getByPlaceholderText(/Enter coupon code/i));
    fireEvent.change(screen.getByPlaceholderText(/Enter coupon code/i), { target: { value: 'BADCODE' } });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Apply'));
    });

    await waitFor(() => {
      expect(screen.getByText('Coupon expired')).toBeInTheDocument();
    });
  });

  it('closes modal when X is clicked', async () => {
    growthService.getBookings.mockResolvedValueOnce({ data: [] });
    await act(async () => {
        render(<BookingSystem businessId={businessId} isOwner={false} ownerId={ownerId} />);
    });
    
    await act(async () => {
        fireEvent.click(screen.getByText(/Book New Appointment/i));
    });

    await waitFor(() => screen.getByText(/Schedule Visit/i));
    
    const closeBtn = screen.getByLabelText('Close');
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByText(/Schedule Visit/i)).not.toBeInTheDocument();
  });
});
