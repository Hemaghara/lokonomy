import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminChurnPredictor from '../../admin/AdminChurnPredictor';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getChurnData: vi.fn().mockResolvedValue({
      data: {
        summary: {
          total: 10,
          highRisk: 3,
          mediumRisk: 5,
          lowRisk: 2
        },
        users: [
          {
            _id: 'u1',
            name: 'John Doe',
            email: 'john@example.com',
            churnRisk: 'high',
            subscription: {
              plan: 'Premium',
              expiryDate: new Date(Date.now() + 172800000).toISOString() // 2 days
            },
            daysLeft: 2,
            daysSinceLogin: 15
          }
        ]
      }
    }),
    sendRenewalReminder: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('AdminChurnPredictor Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary stats and user list', async () => {
    render(<AdminChurnPredictor />);
    
    await screen.findByText(/John Doe/i);
    expect(screen.getAllByText(/Premium/i)[0]).toBeDefined();
    expect(screen.getAllByText(/High Risk/i)[0]).toBeDefined();
    expect(screen.getAllByText(/2 days left/i)[0]).toBeDefined();
  });

  it('handles range switching', async () => {
    render(<AdminChurnPredictor />);
    
    const select = screen.getAllByRole('combobox')[0];
    fireEvent.change(select, { target: { value: '7' } });

    await waitFor(() => {
      expect(adminService.getChurnData).toHaveBeenCalledWith(7);
    });
  });

  it('handles sending renewal reminder', async () => {
    render(<AdminChurnPredictor />);
    
    await waitFor(() => screen.getAllByText('John Doe')[0]);

    const sendBtn = screen.getAllByRole('button', { name: /Send Renewal Reminder/i })[0];
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(adminService.sendRenewalReminder).toHaveBeenCalledWith('u1');
    });
  });

  it('handles manual refresh', async () => {
    render(<AdminChurnPredictor />);
    await screen.findByText(/John Doe/i);
    const refreshBtn = screen.getAllByRole('button', { name: /Refresh/i })[0];
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(adminService.getChurnData).toHaveBeenCalledTimes(2);
    });
  });
});

