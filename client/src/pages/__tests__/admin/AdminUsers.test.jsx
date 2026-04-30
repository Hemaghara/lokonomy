import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminUsers from '../../admin/AdminUsers';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AdminLayout
vi.mock('../../../layouts/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>
}));

// Mock services
vi.mock('../../../services', () => ({
  adminService: {
    getUsers: vi.fn(),
    updateUserStatus: vi.fn(),
    deleteContent: vi.fn(),
    impersonateUser: vi.fn(),
    exportUsersCSV: vi.fn(),
    bulkUpdateUserStatus: vi.fn(),
  }
}));

// Mock useAdminFetch hook directly
vi.mock('../../../hooks/useAdminFetch', () => ({
  __esModule: true,
  default: vi.fn()
}));

// Mock useUrlState
vi.mock('../../../hooks/useUrlState', () => ({
  useUrlState: () => ({
    getParam: (key, def) => def,
    setParam: vi.fn(),
    setParams: vi.fn(),
  })
}));

// Mock useAdminPermission
vi.mock('../../../hooks/useAdminPermission', () => ({
  __esModule: true,
  default: () => ({
    canManageUsers: true,
    role: 'superadmin'
  })
}));

describe('AdminUsers Page', () => {
  const mockRefetch = vi.fn();
  const mockUsers = [
    {
      _id: 'u1',
      name: 'John Doe',
      email: 'john@example.com',
      status: 'active',
      subscription: { plan: 'gold' },
      district: 'Ahmedabad',
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    import.meta.env.VITE_API_URL = 'http://localhost:5000';
  });

  it('renders user list correctly', async () => {
    const useAdminFetchMock = (await import('../../../hooks/useAdminFetch')).default;
    useAdminFetchMock.mockReturnValue({
      data: { users: mockUsers, total: 1, totalPages: 1 },
      loading: false,
      refetch: mockRefetch,
      setData: vi.fn()
    });

    render(<AdminUsers />);
    
    // Use getAllByText because it's rendered in both mobile and desktop views
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('john@example.com').length).toBeGreaterThan(0);
  });

  it('shows empty state when no users found', async () => {
    const useAdminFetchMock = (await import('../../../hooks/useAdminFetch')).default;
    useAdminFetchMock.mockReturnValue({
      data: { users: [], total: 0, totalPages: 0 },
      loading: false,
      refetch: mockRefetch,
      setData: vi.fn()
    });

    render(<AdminUsers />);
    
    expect(screen.getByText(/No users found/i)).toBeInTheDocument();
  });
});
