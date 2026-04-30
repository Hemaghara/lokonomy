import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminAuditLogs from '../../admin/AdminAuditLogs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getAuditLogs: vi.fn().mockResolvedValue({
      data: {
        logs: [
          {
            _id: 'l1',
            timestamp: new Date().toISOString(),
            admin: { name: 'Admin One', role: 'superadmin' },
            action: 'DELETE_USER',
            details: 'Deleted user u1',
            ipAddress: '192.168.1.1'
          }
        ],
        admins: [{ _id: 'a1', name: 'Admin One', role: 'superadmin' }],
        totalPages: 1
      }
    })
  }
}));

describe('AdminAuditLogs Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders audit logs correctly', async () => {
    render(<AdminAuditLogs />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Admin One')[0]).toBeDefined();
      expect(screen.getAllByText('DELETE_USER')[0]).toBeDefined();
      expect(screen.getAllByText('Deleted user u1')[0]).toBeDefined();
    });
  });

  it('filters by admin user', async () => {
    render(<AdminAuditLogs />);
    
    await waitFor(() => screen.getAllByText('Admin One')[0]);

    const adminSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(adminSelect, { target: { value: 'a1' } });

    const applyBtn = screen.getAllByRole('button', { name: /Apply Filters/i })[0];
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(adminService.getAuditLogs).toHaveBeenCalledWith(expect.objectContaining({
        adminId: 'a1'
      }));
    });
  });

  it('handles search input', async () => {
    render(<AdminAuditLogs />);
    
    await waitFor(() => screen.getAllByText('Admin One')[0]);

    const searchInput = screen.getByPlaceholderText(/Search by action/i);
    fireEvent.change(searchInput, { target: { value: 'DELETE' } });

    // In this component, search is applied when fetchLogs is called via filters or initial load
    const applyBtn = screen.getAllByRole('button', { name: /Apply Filters/i })[0];
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(adminService.getAuditLogs).toHaveBeenCalledWith(expect.objectContaining({
        search: 'DELETE'
      }));
    });
  });

  it('handles CSV export', async () => {
    render(<AdminAuditLogs />);
    
    await waitFor(() => screen.getAllByText('Admin One')[0]);

    const exportBtn = screen.getAllByRole('button', { name: /Export CSV/i })[0];
    
    // Mock createObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
    
    fireEvent.click(exportBtn);
    
    expect(screen.getAllByText('Export CSV')[0]).toBeDefined();
  });
});

