import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminSubAdmins from '../../admin/AdminSubAdmins';
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
    getSubAdmins: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            _id: 'a1',
            name: 'Sub Admin One',
            email: 'sub1@lokonomy.com',
            role: 'Content Moderator',
            permissions: ['Content', 'Reports'],
            status: 'Active',
            lastActive: new Date().toISOString()
          }
        ]
      }
    }),
    getAdminActivityLogs: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            _id: 'l1',
            admin: { name: 'Sub Admin One' },
            action: 'LOGIN',
            details: 'Logged into the system',
            timestamp: new Date().toISOString()
          }
        ]
      }
    }),
    deleteSubAdmin: vi.fn().mockResolvedValue({ data: { success: true } }),
    updateSubAdmin: vi.fn().mockResolvedValue({ data: { success: true } }),
    resetSubAdminPassword: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('AdminSubAdmins Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
  });

  it('renders sub-admins list and stats', async () => {
    render(<AdminSubAdmins />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Sub Admin One').length).toBeGreaterThan(0);
      expect(screen.getAllByText('sub1@lokonomy.com').length).toBeGreaterThan(0);
    });
  });

  it('switches to activity logs tab', async () => {
    render(<AdminSubAdmins />);
    
    await waitFor(() => screen.getAllByText('Sub Admin One'));

    const logsTab = screen.getAllByRole('button', { name: /Activity Logs/i })[0];
    fireEvent.click(logsTab);

    await waitFor(() => {
      expect(screen.getAllByText('Recent Administrative Activity')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Logged into the system')[0]).toBeInTheDocument();
    });
  });

  it('filters by search and role', async () => {
    render(<AdminSubAdmins />);
    
    await waitFor(() => screen.getAllByText('Sub Admin One'));

    const searchInput = screen.getByPlaceholderText(/Search by name/i);
    fireEvent.change(searchInput, { target: { value: 'Admin' } });

    const roleSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(roleSelect, { target: { value: 'Content Moderator' } });

    await waitFor(() => {
      expect(adminService.getSubAdmins).toHaveBeenCalledWith(expect.objectContaining({
        search: 'Admin',
        role: 'Content Moderator'
      }));
    });
  });
});
