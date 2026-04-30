import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminActivityHeatmap from '../../admin/AdminActivityHeatmap';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getHeatmapData: vi.fn().mockResolvedValue({
      data: {
        dates: [
          { date: '2026-04-01', signups: 5, revenue: 1000, reports: 0, content: 2 },
          { date: '2026-04-02', signups: 12, revenue: 5000, reports: 1, content: 5 }
        ]
      }
    })
  }
}));

// Mock react-calendar-heatmap as it might be hard to test its internal SVG structure
vi.mock('react-calendar-heatmap', () => ({
  default: ({ values }) => (
    <div data-testid="heatmap">
      {values.map(v => <div key={v.date} data-count={v.count}>{v.date}</div>)}
    </div>
  )
}));

describe('AdminActivityHeatmap Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heatmap and summary', async () => {
    render(<AdminActivityHeatmap />);
    
    await waitFor(() => {
      expect(screen.getByTestId('heatmap')).toBeDefined();
      expect(screen.getAllByText('17')[0]).toBeDefined(); // Total signups (5 + 12)
      expect(screen.getAllByText('Total signups (Last 365 Days)')[0]).toBeDefined();
    });
  });

  it('handles metric switching', async () => {
    render(<AdminActivityHeatmap />);
    
    await waitFor(() => screen.getByTestId('heatmap'));

    const revenueBtn = screen.getAllByRole('button', { name: /Revenue/i })[0];
    fireEvent.click(revenueBtn);

    await waitFor(() => {
      expect(screen.getAllByText('6,000')[0]).toBeDefined(); // Total revenue (1000 + 5000)
      expect(screen.getAllByText('Total revenue (Last 365 Days)')[0]).toBeDefined();
    });
  });

  it('handles manual refresh', async () => {
    render(<AdminActivityHeatmap />);
    await waitFor(() => screen.getByTestId('heatmap'));
    
    const refreshBtn = screen.getAllByRole('button', { name: /Refresh/i })[0];
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(adminService.getHeatmapData).toHaveBeenCalledTimes(2);
    });
  });
});

