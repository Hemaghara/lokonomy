import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminSubscriptions from '../../admin/AdminSubscriptions';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock recharts
vi.mock('recharts', () => ({
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
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
    getSubscriptionTransactions: vi.fn().mockResolvedValue({
      data: {
        transactions: [
          {
            _id: 't1',
            user: { name: 'John Doe', email: 'john@example.com' },
            plan: 'gold',
            amount: 5000,
            status: 'success',
            createdAt: new Date().toISOString(),
            durationMonths: 1
          }
        ],
        totalPages: 1,
        planStats: {},
        failedCount: 2
      }
    }),
    getRevenueData: vi.fn().mockResolvedValue({
      data: {
        labels: ['Jan', 'Feb'],
        datasets: { total: [10000, 15000] },
        summary: { periodRevenue: 25000, revenueBreakdown: { gold: 15000 } }
      }
    }),
    getFailedPayments: vi.fn().mockResolvedValue({
      data: {
        payments: [
          {
            _id: 'f1',
            user: { name: 'Alice', email: 'alice@example.com' },
            plan: 'silver',
            amount: 1000,
            failureReason: 'Card declined',
            createdAt: new Date().toISOString()
          }
        ],
        totalPages: 1
      }
    }),
    getFinancialReport: vi.fn().mockResolvedValue({
      data: {
        report: {
          allTime: { totalRevenue: 100000, avgRevenuePerUser: 2000 },
          subscribers: { active: 50, expired: 5, byPlan: { silver: 20, gold: 20, platinum: 10 } },
          transactions: { successRate: 98, total: 100, failed: 2 },
          periodStats: { revenue: 10000 }
        }
      }
    }),
    exportSubscriptionTransactions: vi.fn().mockResolvedValue({ data: 'csv data' }),
  }
}));

describe('AdminSubscriptions Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders transactions by default', async () => {
    render(<AdminSubscriptions />);
    
    await waitFor(() => {
      expect(screen.getAllByText('John Doe')[0]).toBeDefined();
      expect(screen.getAllByText(/₹5,000/)[0]).toBeDefined();
    });
  });

  it('switches to revenue tab and displays chart', async () => {
    render(<AdminSubscriptions />);
    
    await waitFor(() => screen.getAllByText('John Doe')[0]);

    const revenueTab = screen.getAllByRole('button', { name: /Revenue/i })[0];
    fireEvent.click(revenueTab);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Revenue Growth/i })).toBeDefined();
      expect(screen.getAllByText(/₹25,000/)[0]).toBeDefined();
    });
  });

  it('switches to failures tab', async () => {
    render(<AdminSubscriptions />);
    
    await waitFor(() => screen.getAllByText('John Doe')[0]);

    const failedTab = screen.getAllByRole('button', { name: /Failures/i })[0];
    fireEvent.click(failedTab);

    await waitFor(() => {
      expect(screen.getAllByText('Alice')[0]).toBeDefined();
      expect(screen.getAllByText('Card declined')[0]).toBeDefined();
    });
  });

  it('handles report export', async () => {
    render(<AdminSubscriptions />);
    
    await waitFor(() => screen.getAllByText('John Doe')[0]);

    const reportsTab = screen.getAllByRole('button', { name: /Reports/i })[0];
    fireEvent.click(reportsTab);

    await waitFor(() => screen.getAllByText("All-Time Revenue")[0]);

    const downloadBtn = screen.getAllByRole('button', { name: "Download" })[0];
    
    global.URL.createObjectURL = vi.fn();
    fireEvent.click(downloadBtn);
    
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
