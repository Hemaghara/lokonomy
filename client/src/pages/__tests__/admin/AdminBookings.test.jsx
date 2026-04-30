import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminBookings from '../../admin/AdminBookings';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    adminService: {
      getBookings: vi.fn().mockResolvedValue({
        data: {
          bookings: [
            {
              _id: 'b1',
              userName: 'Customer One',
              userId: { phoneNumber: '1234567890' },
              serviceName: 'Haircut',
              businessId: { name: 'Salon A' },
              status: 'pending',
              date: '2026-05-01',
              timeSlot: '10:00 AM'
            }
          ],
          stats: { pending: 5, confirmed: 3, completed: 10, cancelled: 2 }
        }
      }),
      updateBookingStatus: vi.fn().mockResolvedValue({ data: { success: true } }),
    }
  };
});

describe('AdminBookings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bookings list and stats', async () => {
    render(<AdminBookings />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Customer One')[0]).toBeDefined();
      expect(screen.getAllByText('Haircut')[0]).toBeDefined();
      expect(screen.getAllByText('pending')[0]).toBeDefined();
      expect(screen.getAllByText('5')[0]).toBeDefined(); // Pending count
    });
  });

  it('handles filtering by status', async () => {
    render(<AdminBookings />);
    
    const filterSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(filterSelect, { target: { value: 'confirmed' } });

    await waitFor(() => {
      expect(adminService.getBookings).toHaveBeenCalledWith(expect.objectContaining({
        status: 'confirmed'
      }));
    });
  });

  it('handles search input', async () => {
    render(<AdminBookings />);
    
    const searchInput = screen.getByPlaceholderText(/Search by user or service name/i);
    fireEvent.change(searchInput, { target: { value: 'Haircut' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });

    await waitFor(() => {
      expect(adminService.getBookings).toHaveBeenCalledWith(expect.objectContaining({
        search: 'Haircut'
      }));
    });
  });

  it('handles booking status update', async () => {
    render(<AdminBookings />);
    
    await waitFor(() => screen.getAllByText('Customer One')[0]);

    const changeStatusBtn = screen.getAllByText('Change Status')[0];
    fireEvent.click(changeStatusBtn);

    const confirmBtn = screen.getAllByRole('button', { name: /confirmed/i })[0];
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminService.updateBookingStatus).toHaveBeenCalledWith('b1', 'confirmed');
    });
  });
});

