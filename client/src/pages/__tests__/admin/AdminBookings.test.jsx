import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminBookings from '../../admin/AdminBookings';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';
import { toast } from 'react-hot-toast';

vi.mock('../../../services', () => ({
  adminService: {
    getBookings: vi.fn(),
    updateBookingStatus: vi.fn()
  }
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe('AdminBookings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    stats: {
      pending: 10,
      confirmed: 5,
      completed: 20,
      cancelled: 2
    },
    bookings: [
      {
        _id: 'b1',
        userName: 'Alice Smith',
        userId: { phoneNumber: '1234567890' },
        status: 'pending',
        serviceName: 'Plumbing Repair',
        date: '2026-05-01',
        timeSlot: '10:00 AM',
        businessId: { name: 'Bob Plumbing' }
      },
      {
        _id: 'b2',
        userName: 'Charlie',
        userId: null,
        status: 'completed',
        serviceName: 'Cleaning',
        date: '2026-05-02',
        timeSlot: '12:00 PM',
        businessId: { name: 'Clean Co' }
      }
    ]
  };

  it('renders loading state initially', () => {
    adminService.getBookings.mockReturnValue(new Promise(() => {}));
    render(<AdminBookings />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('fetches and renders bookings correctly', async () => {
    adminService.getBookings.mockResolvedValueOnce({ data: mockData });
    render(<AdminBookings />);
    
    await waitFor(() => {
      expect(adminService.getBookings).toHaveBeenCalledWith({ status: 'all', search: '' });
      expect(screen.getByText('10')).toBeInTheDocument(); // pending stats
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('1234567890')).toBeInTheDocument();
      expect(screen.getByText('Plumbing Repair')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText('No Phone')).toBeInTheDocument();
      expect(screen.getByText('Clean Co')).toBeInTheDocument();
    });
  });

  it('renders empty bookings state', async () => {
    adminService.getBookings.mockResolvedValueOnce({ data: { stats: {}, bookings: [] } });
    render(<AdminBookings />);
    
    await waitFor(() => {
      expect(screen.getByText('No bookings found')).toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    adminService.getBookings.mockResolvedValue({ data: mockData });
    render(<AdminBookings />);
    
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
    
    adminService.getBookings.mockClear();
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'pending' } });
    
    await waitFor(() => {
      expect(adminService.getBookings).toHaveBeenCalledWith({ status: 'pending', search: '' });
    });
  });

  it('searches when enter is pressed', async () => {
    adminService.getBookings.mockResolvedValue({ data: mockData });
    render(<AdminBookings />);
    
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
    
    adminService.getBookings.mockClear();
    
    const input = screen.getByPlaceholderText(/Search by user or service name/i);
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    await waitFor(() => {
      expect(adminService.getBookings).toHaveBeenCalledWith({ status: 'all', search: 'Alice' });
    });
  });

  it('updates booking status', async () => {
    adminService.getBookings.mockResolvedValue({ data: mockData });
    adminService.updateBookingStatus.mockResolvedValueOnce({});
    
    render(<AdminBookings />);
    
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
    
    adminService.getBookings.mockClear();
    
    // Find the change status button for completed inside the first booking's dropdown
    const updateBtns = screen.getAllByText('completed');
    // updateBtns[0] might be the stat card or the select option.
    // Let's rely on finding all buttons with text 'completed' and clicking the one in the dropdown
    // The dropdown ones have class w-full text-left...
    const dropdownBtns = screen.getAllByRole('button', { name: 'completed' });
    fireEvent.click(dropdownBtns[0]);
    
    await waitFor(() => {
      expect(adminService.updateBookingStatus).toHaveBeenCalledWith('b1', 'completed');
      expect(toast.success).toHaveBeenCalledWith('Booking updated');
      expect(adminService.getBookings).toHaveBeenCalledTimes(1); // refetch
    });
  });

  it('handles fetch bookings failure', async () => {
    adminService.getBookings.mockRejectedValueOnce(new Error('Failed'));
    render(<AdminBookings />);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch bookings');
    });
  });

  it('handles update booking status failure', async () => {
    adminService.getBookings.mockResolvedValue({ data: mockData });
    adminService.updateBookingStatus.mockRejectedValueOnce(new Error('Failed'));
    
    render(<AdminBookings />);
    
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
    
    const dropdownBtns = screen.getAllByRole('button', { name: 'completed' });
    fireEvent.click(dropdownBtns[0]);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Update failed');
    });
  });
});
