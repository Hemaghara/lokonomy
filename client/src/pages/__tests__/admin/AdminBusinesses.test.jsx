import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminBusinesses from '../../admin/AdminBusinesses';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';
import { useConfirm } from '../../../context/ConfirmContext';

// Mock recharts
vi.mock('recharts', () => ({
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => <div />,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
}));

// Mock Confirm Context
vi.mock('../../../context/ConfirmContext', () => ({
  useConfirm: vi.fn(),
  ConfirmProvider: ({ children }) => <div>{children}</div>
}));

// Mock AdminLayout
vi.mock('../../../layouts/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>
}));

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getBusinesses: vi.fn().mockResolvedValue({
      data: [
        {
          _id: 'b1',
          businessName: 'Global Bakery',
          mainCategory: 'Food',
          status: 'verified',
          district: 'Ahmedabad',
          ownerName: 'Jane Smith',
          createdAt: new Date().toISOString()
        }
      ]
    }),
    deleteContent: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('AdminBusinesses Page', () => {
  const mockConfirm = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    useConfirm.mockReturnValue(mockConfirm);
  });

  it('renders business list correctly', async () => {
    render(<AdminBusinesses />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Global Bakery').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
    });
  });

  it('filters businesses by search', async () => {
    render(<AdminBusinesses />);
    
    await waitFor(() => {
        expect(screen.getAllByText('Global Bakery').length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(/Search businesses/i);
    fireEvent.change(searchInput, { target: { value: 'Bakery' } });

    // Local filtering should work
    expect(screen.getAllByText('Global Bakery').length).toBeGreaterThan(0);
  });

  it('handles business deletion', async () => {
    mockConfirm.mockResolvedValue(true);
    render(<AdminBusinesses />);
    
    await waitFor(() => {
        expect(screen.getAllByText('Global Bakery').length).toBeGreaterThan(0);
    });

    // The delete button in mobile view has bg-rose-500/10 and is a button
    // In desktop view it's in a tr/td
    // Let's use getAllByRole and filter or just find by FiTrash2 if possible
    const deleteBtns = screen.getAllByLabelText('Delete Business');
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(adminService.deleteContent).toHaveBeenCalledWith('business', 'b1');
    });
  });

  it('handles empty state', async () => {
    adminService.getBusinesses.mockResolvedValueOnce({ data: [] });
    render(<AdminBusinesses />);
    await waitFor(() => {
      expect(screen.getByText(/No businesses found/i)).toBeInTheDocument();
    });
  });
});
