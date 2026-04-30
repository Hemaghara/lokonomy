import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminUserDetails from '../../admin/AdminUserDetails';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock AdminLayout
vi.mock('../../../layouts/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => React.createElement('div', { 'data-testid': 'admin-layout' }, children)
}));

// Mock react-router-dom with useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'u1' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getUserDetails: vi.fn().mockResolvedValue({
      data: {
        user: {
          _id: 'u1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          phoneNumber: '9876543210',
          status: 'active',
          loyaltyPoints: 1200,
          district: 'Mehsana',
          taluka: 'Kadi',
          locationName: '123 Main St, Kadi',
          subscription: { plan: 'Premium', status: 'active' },
          createdAt: new Date().toISOString()
        },
        businesses: [
          { _id: 'b1', businessName: 'Alice Shop', mainCategory: 'Retail', district: 'Mehsana' }
        ],
        products: [],
        jobs: [
          { _id: 'j1', title: 'Sales Executive', jobType: 'Full-time', createdAt: new Date().toISOString() }
        ],
        orders: [
          { _id: 'o1', product: { name: 'Smart Watch' }, price: 2000, paymentStatus: 'Paid' }
        ]
      }
    }),
    getUserRiskScore: vi.fn().mockResolvedValue({
      data: {
        riskScore: 15,
        flags: ['New Account']
      }
    }),
    updateUserStatus: vi.fn().mockResolvedValue({ data: { success: true } }),
    impersonateUser: vi.fn().mockResolvedValue({
      data: {
        token: 'mock-token',
        user: { _id: 'u1', name: 'Alice Smith' },
        message: 'Impersonation successful'
      }
    }),
  }
}));

describe('AdminUserDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getUserDetails.mockResolvedValue({
      data: {
        user: {
          _id: 'u1', name: 'Alice Smith', email: 'alice@example.com',
          phoneNumber: '9876543210', status: 'active', loyaltyPoints: 1200,
          district: 'Mehsana', taluka: 'Kadi', locationName: '123 Main St, Kadi',
          subscription: { plan: 'Premium', status: 'active' },
          createdAt: new Date().toISOString()
        },
        businesses: [{ _id: 'b1', businessName: 'Alice Shop', mainCategory: 'Retail', district: 'Mehsana' }],
        products: [],
        jobs: [{ _id: 'j1', title: 'Sales Executive', jobType: 'Full-time', createdAt: new Date().toISOString() }],
        orders: [{ _id: 'o1', product: { name: 'Smart Watch' }, price: 2000, paymentStatus: 'Paid' }]
      }
    });
    adminService.getUserRiskScore.mockResolvedValue({
      data: { riskScore: 15, flags: ['New Account'] }
    });
    adminService.updateUserStatus.mockResolvedValue({ data: { success: true } });
    adminService.impersonateUser.mockResolvedValue({
      data: { token: 'mock-token', user: { _id: 'u1', name: 'Alice Smith' }, message: 'Impersonation successful' }
    });
  });

  it('renders user profile and statistics', async () => {
    render(<AdminUserDetails />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Alice Smith').length).toBeGreaterThan(0);
      expect(screen.getAllByText('alice@example.com')[0]).toBeInTheDocument();
      expect(screen.getAllByText('1200 pts')[0]).toBeInTheDocument();
      // Plan shown as "Premium"
      expect(screen.getAllByText('Premium').length).toBeGreaterThan(0);
      expect(screen.getAllByText('123 Main St, Kadi')[0]).toBeInTheDocument();
    });
  });

  it('handles suspend status update', async () => {
    render(<AdminUserDetails />);
    
    await waitFor(() => screen.getAllByText('Alice Smith'));

    const suspendBtn = screen.getAllByRole('button', { name: /Suspend/i })[0];
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(adminService.updateUserStatus).toHaveBeenCalledWith('u1', 'suspended');
    });
  });

  it('handles impersonation', async () => {
    render(<AdminUserDetails />);
    
    await waitFor(() => screen.getAllByText('Alice Smith'));

    const impersonateBtn = screen.getAllByRole('button', { name: /Log in as User/i })[0];
    fireEvent.click(impersonateBtn);

    await waitFor(() => {
      expect(adminService.impersonateUser).toHaveBeenCalledWith('u1');
    });
  });

  it('renders risk score and flags', async () => {
    render(<AdminUserDetails />);
    
    await waitFor(() => {
      expect(screen.getAllByText('15%')[0]).toBeInTheDocument();
      expect(screen.getAllByText('New Account')[0]).toBeInTheDocument();
    });
  });

  it('renders platform assets correctly', async () => {
    render(<AdminUserDetails />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Alice Shop')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Sales Executive')[0]).toBeInTheDocument();
    });
  });
});
