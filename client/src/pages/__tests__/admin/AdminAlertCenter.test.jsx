import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminAlertCenter from '../../admin/AdminAlertCenter';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAlerts = [
  {
    id: 'a1',
    title: 'Critical System Error',
    message: 'Database connection failed',
    severity: 'critical',
    type: 'system_health',
    timestamp: new Date().toISOString(),
    actionPath: '/admin/settings'
  },
  {
    id: 'a2',
    title: 'Low Inventory',
    message: 'Product X is low on stock',
    severity: 'warning',
    type: 'report_threshold',
    timestamp: new Date().toISOString()
  }
];

const mockAlertsResponse = {
  data: {
    alerts: mockAlerts,
    total: 2,
    critical: 1,
    warning: 1,
    info: 0
  }
};

// Mock adminService
vi.mock('../../../services', () => {
  const mockAlerts = [
    {
      id: 'a1',
      title: 'Critical System Error',
      message: 'Database connection failed',
      severity: 'critical',
      type: 'system_health',
      timestamp: new Date().toISOString(),
      actionPath: '/admin/settings'
    },
    {
      id: 'a2',
      title: 'Low Inventory',
      message: 'Product X is low on stock',
      severity: 'warning',
      type: 'report_threshold',
      timestamp: new Date().toISOString()
    }
  ];

  const mockAlertsResponse = {
    data: {
      alerts: mockAlerts,
      total: 2,
      critical: 1,
      warning: 1,
      info: 0
    }
  };

  return {
    adminService: {
      getAlerts: vi.fn().mockResolvedValue(mockAlertsResponse),
    }
  };
});

// Mock socket
vi.mock('../../../services/socket', () => ({
  connectSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }),
  getSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }),
}));

describe('AdminAlertCenter Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup mock after clearAllMocks using dynamic import pattern
  });

  it('renders alerts and stats', async () => {
    const { adminService } = await import('../../../services');
    adminService.getAlerts.mockResolvedValue(mockAlertsResponse);

    render(<AdminAlertCenter />);
    
    const criticalAlert = await screen.findByText(/Critical System Error/i);
    expect(criticalAlert).toBeInTheDocument();
    
    expect(screen.getByText(/Database connection failed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Low Inventory/i).length).toBeGreaterThan(0);
  });

  it('handles filtering by severity', async () => {
    const { adminService } = await import('../../../services');
    adminService.getAlerts.mockResolvedValue(mockAlertsResponse);

    render(<AdminAlertCenter />);
    
    await screen.findByText(/Critical System Error/i);

    const criticalFilter = screen.getAllByRole('button', { name: /^critical$/i })[0];
    fireEvent.click(criticalFilter);

    expect(screen.getAllByText(/Critical System Error/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Low Inventory/i)).toBeNull();
  });

  it('handles manual refresh', async () => {
    const { adminService } = await import('../../../services');
    adminService.getAlerts.mockResolvedValue(mockAlertsResponse);

    render(<AdminAlertCenter />);
    
    await screen.findByText(/Critical System Error/i);

    const refreshBtn = screen.getAllByRole('button', { name: /Refresh/i })[0];
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(adminService.getAlerts).toHaveBeenCalledTimes(2);
    });
  });

  it('shows empty state when no alerts match info filter', async () => {
    const { adminService } = await import('../../../services');
    adminService.getAlerts.mockResolvedValue(mockAlertsResponse);

    render(<AdminAlertCenter />);
    
    await screen.findByText(/Critical System Error/i);

    const infoFilter = screen.getAllByRole('button', { name: /^info$/i })[0];
    fireEvent.click(infoFilter);

    expect(screen.getByText(/All Clear/i)).toBeInTheDocument();
    expect(screen.getByText(/No info alerts at the moment/i)).toBeInTheDocument();
  });
});
