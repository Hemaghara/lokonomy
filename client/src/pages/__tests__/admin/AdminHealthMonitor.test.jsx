import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminHealthMonitor from '../../admin/AdminHealthMonitor';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getHealthStatus: vi.fn().mockResolvedValue({
      data: {
        api: 'healthy',
        database: 'healthy',
        redis: 'healthy',
        cpu: 25,
        memory: 60,
        uptime: '15d 4h 20m',
        dbPing: 12
      }
    })
  }
}));

describe('AdminHealthMonitor Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders health status of all systems', async () => {
    render(<AdminHealthMonitor />);
    
    await waitFor(() => {
      expect(screen.getAllByText('API Cluster')[0]).toBeDefined();
      expect(screen.getAllByText('Primary DB')[0]).toBeDefined();
      expect(screen.getAllByText('Cache Engine')[0]).toBeDefined();
      expect(screen.getAllByText('Healthy').length).toBeGreaterThanOrEqual(3);
    });
  });

  it('renders resource usage and uptime', async () => {
    render(<AdminHealthMonitor />);
    
    await waitFor(() => {
      expect(screen.getAllByText('25%')[0]).toBeDefined(); // CPU
      expect(screen.getAllByText('60%')[0]).toBeDefined(); // Memory
      expect(screen.getAllByText('15d 4h 20m')[0]).toBeDefined(); // Uptime
    });
  });

  it('renders incident logs correctly', async () => {
    render(<AdminHealthMonitor />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Primary DB Latency: 12ms')[0]).toBeDefined();
      expect(screen.getAllByText('Warning')[0]).toBeDefined();
    });
  });

  it('handles manual refresh diagnostics', async () => {
    render(<AdminHealthMonitor />);
    
    // Wait for initial load
    await screen.findByText(/Healthy/i);
    
    const refreshBtn = screen.getAllByRole('button', { name: /Refresh Diagnostics/i })[0];
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(adminService.getHealthStatus).toHaveBeenCalledTimes(2);
    });
  });

  it('shows "Down" status on API failure', async () => {
    adminService.getHealthStatus.mockRejectedValueOnce(new Error('Network Error'));
    
    render(<AdminHealthMonitor />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Down').length).toBeGreaterThanOrEqual(2);
    });
  });
});

