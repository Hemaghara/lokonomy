import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import AdminDashboard from '../admin/AdminDashboard';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../services';

// Mock adminService
vi.mock('../../services', () => ({
  adminService: {
    getDashboardStats: vi.fn().mockResolvedValue({
      data: {
        stats: {
          totalRevenue: 100000,
          totalUsers: 500,
          totalBusinesses: 50,
          totalProducts: 200,
          totalJobs: 30,
          revenueBreakdown: { silver: 20000, gold: 30000, platinum: 50000 },
          trends: { revenue: '+10%', users: '+5%' }
        },
        recentUsers: [
          { _id: 'u1', name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() }
        ],
        recentBusinesses: [
          { _id: 'b1', businessName: 'Cool Shop', createdAt: new Date().toISOString() }
        ]
      }
    }),
    getOnlineTrend: vi.fn().mockResolvedValue({ data: [{ count: 10 }] }),
  },
}));

// Mock socket
vi.mock('../../services/socket', () => ({
  connectSocket: () => ({
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => {
  const toastMock = {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  };
  return { default: toastMock, toast: toastMock, Toaster: () => null };
});

// Mock AdminLayout to render children directly
vi.mock('../../layouts/AdminLayout', () => ({
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const p = { ...props };
      ['initial','animate','exit','transition','layout','whileHover','whileTap','whileInView','layoutId'].forEach(k => delete p[k]);
      return <div {...p}>{children}</div>;
    },
    span: ({ children, ...props }) => {
      const p = { ...props };
      ['initial','animate','exit','transition','layout','whileHover','whileTap'].forEach(k => delete p[k]);
      return <span {...p}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock Recharts since it uses DOM measurements that might fail in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }) => <svg data-testid="area-chart">{children}</svg>,
  Area: () => null,
  Tooltip: () => null,
}));

describe('AdminDashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('adminInfo', JSON.stringify({ id: 'admin1', name: 'Admin User' }));
  });

  it('renders stats correctly', async () => {
    render(<AdminDashboard />);
    
    // Wait for stats to load
    await screen.findByText(/Total Revenue/i);
    
    // Flexible regex to handle different locale formatting (100,000 or 1,00,000)
    expect(screen.getByText(/1[0,]*000/)).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Cool Shop')).toBeInTheDocument();
  });


  it('filters stats by date range', async () => {
    render(<AdminDashboard />);
    
    // Wait for stats to load by checking for one of the labels
    await screen.findByText(/Total Revenue/i);
    
    // Check for the revenue value with flexible formatting
    expect(screen.getByText(/1[0,]*000/)).toBeInTheDocument();

    const startDate = screen.getByTitle('Start date');
    const endDate = screen.getByTitle('End date');

    fireEvent.change(startDate, { target: { value: '2023-01-01' } });
    fireEvent.change(endDate, { target: { value: '2023-01-31' } });

    await waitFor(() => {
      expect(adminService.getDashboardStats).toHaveBeenCalledWith(expect.objectContaining({
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      }));
    });
  });

  it('displays revenue breakdown bars', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/gold tier/i)).toBeDefined();
      expect(screen.getAllByText(/3[0,]*000/)[0]).toBeDefined();
    });
  });
});
