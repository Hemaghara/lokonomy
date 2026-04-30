import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../../../utils/test-utils';
import AdminPushNotifications from '../../admin/AdminPushNotifications';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getNotificationHistory: vi.fn().mockResolvedValue({
      data: [
        {
          title: 'Past Alert',
          message: 'Hello all',
          targetPlan: 'All Users',
          recipientCount: 100,
          sentAt: new Date().toISOString()
        }
      ]
    }),
    getScheduledNotifications: vi.fn().mockResolvedValue({
      data: [
        {
          _id: 's1',
          title: 'Scheduled Alert',
          message: 'Coming soon',
          target: 'all',
          scheduledFor: new Date(Date.now() + 86400000).toISOString()
        }
      ]
    }),
    sendGlobalNotification: vi.fn().mockResolvedValue({ data: { success: true } }),
    sendPlanNotification: vi.fn().mockResolvedValue({ data: { success: true } }),
    scheduleNotification: vi.fn().mockResolvedValue({ data: { success: true } }),
    cancelScheduledNotification: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('AdminPushNotifications Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders send notification form by default', async () => {
    await act(async () => {
      render(<AdminPushNotifications />);
    });
    
    expect(screen.getAllByText('Broadcast to All')[0]).toBeDefined();
    expect(screen.getAllByText('Targeted Plan Notification')[0]).toBeDefined();
  });

  it('handles sending a global notification', async () => {
    const { adminService } = await import('../../../services');
    await act(async () => {
      render(<AdminPushNotifications />);
    });
    
    const titleInput = screen.getByPlaceholderText(/e.g., System Maintenance/i);
    const messageInput = screen.getByPlaceholderText(/Type your message here/i);
    
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Global Title' } });
      fireEvent.change(messageInput, { target: { value: 'Global Message' } });
    });

    const sendBtn = screen.getAllByRole('button', { name: /Send Global Broadcast/i })[0];
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    await waitFor(() => {
      expect(adminService.sendGlobalNotification).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Global Title',
        message: 'Global Message'
      }));
    });
  });

  it('switches tabs and renders history', async () => {
    await act(async () => {
      render(<AdminPushNotifications />);
    });
    
    const historyTab = screen.getAllByRole('button', { name: /Message History/i })[0];
    await act(async () => {
      fireEvent.click(historyTab);
    });

    await waitFor(() => {
      expect(screen.getAllByText('Past Alert')[0]).toBeDefined();
    });
  });

  it('switches tabs and renders scheduled notifications', async () => {
    const { adminService } = await import('../../../services');
    await act(async () => {
      render(<AdminPushNotifications />);
    });
    
    const scheduledTab = screen.getAllByRole('button', { name: /Scheduled/i })[0];
    await act(async () => {
      fireEvent.click(scheduledTab);
    });

    await waitFor(() => {
      expect(screen.getAllByText('Scheduled Alert')[0]).toBeDefined();
    });

    const cancelBtn = screen.queryByTitle('Cancel');
    if (cancelBtn) {
      await act(async () => {
        fireEvent.click(cancelBtn);
      });

      await waitFor(() => {
        expect(adminService.cancelScheduledNotification).toHaveBeenCalledWith('s1');
      });
    }
  });
});
