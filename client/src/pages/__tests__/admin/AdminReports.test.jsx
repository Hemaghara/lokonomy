import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminReports from '../../admin/AdminReports';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    exportExcel: vi.fn().mockResolvedValue({
      data: new Blob(['mock excel content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    })
  }
}));

describe('AdminReports Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders all report export options', () => {
    render(<AdminReports />);
    
    expect(screen.getAllByText(/User Directory/i)[0]).toBeDefined();
    expect(screen.getAllByText(/Sales & Orders/i)[0]).toBeDefined();
    expect(screen.getAllByText(/Business Registry/i)[0]).toBeDefined();
  });

  it('handles user report export', async () => {
    render(<AdminReports />);
    
    const downloadBtns = screen.getAllByRole('button', { name: /Download Excel/i });
    fireEvent.click(downloadBtns[0]); // User Directory

    await waitFor(() => {
      expect(adminService.exportExcel).toHaveBeenCalledWith('users');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('handles orders report export', async () => {
    render(<AdminReports />);
    
    const downloadBtns = screen.getAllByRole('button', { name: /Download Excel/i });
    fireEvent.click(downloadBtns[1]); // Sales & Orders

    await waitFor(() => {
      expect(adminService.exportExcel).toHaveBeenCalledWith('orders');
    });
  });

  it('handles business report export', async () => {
    render(<AdminReports />);
    
    const downloadBtns = screen.getAllByRole('button', { name: /Download Excel/i });
    fireEvent.click(downloadBtns[2]); // Business Registry

    await waitFor(() => {
      expect(adminService.exportExcel).toHaveBeenCalledWith('businesses');
    });
  });

  it('shows loading state during export', async () => {
    // Delay the mock response
    adminService.exportExcel.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: new Blob() }), 100)));
    
    render(<AdminReports />);
    
    const downloadBtn = screen.getAllByRole('button', { name: /Download Excel/i })[0];
    fireEvent.click(downloadBtn);

    expect(screen.getAllByRole('button', { name: /Download Excel/i })[0]).toBeDisabled();
    
    await waitFor(() => {
      const disabledButtons = screen.queryAllByRole('button', { name: /Download Excel/i }).filter(btn => btn.disabled);
      expect(disabledButtons.length).toBe(0);
    });
  });
});

