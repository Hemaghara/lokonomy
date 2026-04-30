import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminOrders from '../../admin/AdminOrders';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock AdminLayout
vi.mock('../../../layouts/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>
}));

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getMarketOrders: vi.fn().mockResolvedValue({
      data: {
        orders: [
          {
            _id: 'o1',
            product: { productName: 'Laptop', subCategory: 'Electronics' },
            buyer: { name: 'Alice' },
            seller: { name: 'Store A' },
            price: 50000,
            orderStatus: 'pending',
            createdAt: new Date().toISOString()
          }
        ],
        totalPages: 1,
        totalOrders: 1
      }
    }),
    updateOrderStatus: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('AdminOrders Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders orders list correctly', async () => {
    render(<AdminOrders />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Laptop').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Alice/i).length).toBeGreaterThan(0);
    });
  });

  it('handles search input on Enter', async () => {
    render(<AdminOrders />);
    
    const searchInput = screen.getByPlaceholderText(/Search by order ID/i);
    fireEvent.change(searchInput, { target: { value: 'Laptop' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });

    await waitFor(() => {
      expect(adminService.getMarketOrders).toHaveBeenCalledWith(expect.objectContaining({
        search: 'Laptop'
      }));
    });
  });

  it('handles status filter change', async () => {
    render(<AdminOrders />);
    
    const filtersBtn = screen.getByText(/Filters/i);
    fireEvent.click(filtersBtn);
    
    await waitFor(() => screen.getAllByRole('combobox')[0]);
    const statusSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(statusSelect, { target: { value: 'processing' } });

    await waitFor(() => {
      expect(adminService.getMarketOrders).toHaveBeenCalledWith(expect.objectContaining({
        status: 'processing'
      }));
    });
  });

  it('handles empty state', async () => {
    adminService.getMarketOrders.mockResolvedValueOnce({ data: { orders: [], totalOrders: 0 } });
    render(<AdminOrders />);
    await waitFor(() => {
      expect(screen.getByText(/No orders found/i)).toBeInTheDocument();
    });
  });
});
