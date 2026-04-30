import React from 'react';
import { render, screen, waitFor } from '../../../utils/test-utils';
import AdminDashboard from '../../admin/AdminDashboard';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock services
vi.mock('../../../services', () => ({
  adminService: {
    getDashboardStats: vi.fn().mockResolvedValue({
      data: {
        stats: {
          totalUsers: 1500,
          totalBusinesses: 450,
          totalProducts: 1200,
          totalJobs: 300,
          totalRevenue: 50000,
          activeOrders: 25,
          pendingVerifications: 10,
          totalSupportTickets: 5,
          revenueBreakdown: { silver: 20000, gold: 20000, platinum: 10000 },
          trends: { users: '+10%', businesses: '+5%', products: '+2%', jobs: '+1%', revenue: '+15%' }
        },
        recentUsers: [
            { _id: 'u1', name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() }
        ],
        recentBusinesses: [
            { _id: 'b1', businessName: 'Fresh Bake', createdAt: new Date().toISOString() }
        ]
      }
    }),
    getOnlineTrend: vi.fn().mockResolvedValue({
      data: [{ count: 10 }, { count: 20 }, { count: 30 }]
    }),
    getAuditLogs: vi.fn().mockResolvedValue({
      data: {
        logs: []
      }
    }),
  }
}));

// Mock connectSocket to avoid real WebSocket
vi.mock('../../../services/socket', () => ({
  connectSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  }),
  getSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }),
}));

describe('AdminDashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stats correctly', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/1,500/i).length).toBeGreaterThan(0);
    });
  });

  it('renders recent activity feed', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/John Doe/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Fresh Bake/i).length).toBeGreaterThan(0);
    });
  });
});
