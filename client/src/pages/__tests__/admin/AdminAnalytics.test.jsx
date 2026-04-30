import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminAnalytics from '../../admin/AdminAnalytics';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock recharts
vi.mock('recharts', () => ({
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Legend: () => <div />,
}));

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getAnalyticsOverview: vi.fn().mockResolvedValue({
      data: {
        totalUsers: 1000,
        newUsersThisMonth: 50,
        totalBusinesses: 200,
        newBusinessesThisMonth: 10,
        totalJobs: 150,
        newJobsThisMonth: 15,
        totalApplications: 500,
        totalRevenue: 100000,
        revenueThisMonth: 10000
      }
    }),
    getUserGrowth: vi.fn().mockResolvedValue({
      data: { series: [{ label: 'Jan', count: 100 }] }
    }),
    getBusinessGrowth: vi.fn().mockResolvedValue({
      data: { series: [{ label: 'Jan', count: 20 }] }
    }),
    getJobTrends: vi.fn().mockResolvedValue({
      data: { series: [{ label: 'Jan', jobs: 30, applications: 100 }] }
    }),
    getRevenueTrends: vi.fn().mockResolvedValue({
      data: { 
        series: [{ label: 'Jan', silver: 5000, gold: 3000, platinum: 2000 }],
        planBreakdown: [{ _id: 'silver', total: 5000, count: 10 }]
      }
    }),
    getRegionStats: vi.fn().mockResolvedValue({
      data: { regions: [{ name: 'Mumbai', users: 500, businesses: 100 }] }
    }),
    exportExcel: vi.fn().mockResolvedValue({ data: new Blob() }),
  }
}));

describe('AdminAnalytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders KPI cards correctly', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => {
      // Total Users KPI card shows "1,000"
      expect(screen.getAllByText(/1,000/).length).toBeGreaterThan(0);
    });
  });

  it('changes period for user growth chart', async () => {
    const { adminService } = await import('../../../services');
    render(<AdminAnalytics />);
    
    await waitFor(() => screen.getAllByText(/1,000/));

    const dailyBtn = screen.getAllByRole('button', { name: /Daily/i })[0];
    fireEvent.click(dailyBtn);

    await waitFor(() => {
      expect(adminService.getUserGrowth).toHaveBeenCalledWith('daily');
    });
  });

  it('handles report download', async () => {
    render(<AdminAnalytics />);
    
    await waitFor(() => screen.getAllByText(/1,000/));

    const downloadBtn = screen.getAllByRole('button', { name: /Download Report/i })[0];
    
    fireEvent.click(downloadBtn);
    
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });
});
