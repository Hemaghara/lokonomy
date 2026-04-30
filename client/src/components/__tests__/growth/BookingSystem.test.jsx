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
    });
  });

  it('allows owner to update booking status', async () => {
    growthService.updateBookingStatus.mockResolvedValue({ data: { success: true } });
    await act(async () => {
        render(<BookingSystem businessId={businessId} isOwner={true} ownerId={ownerId} />);
    });

    await waitFor(() => screen.getByTitle('Approve'));
    
    await act(async () => {
        fireEvent.click(screen.getByTitle('Approve'));
    });
    expect(growthService.updateBookingStatus).toHaveBeenCalled();
  });
});
