import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Notifications from '../Notifications';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from "../../services";
import { connectSocket } from '../../services/socket';

// Mock services
vi.mock('../../services', () => ({
  notificationService: {
    getNotifications: vi.fn().mockResolvedValue({
      data: {
        success: true,
        notifications: [
          { _id: 'n1', title: 'Order Received', message: 'You have a new order', type: 'order', read: false, createdAt: new Date() },
          { _id: 'n2', title: 'System Update', message: 'New features added', type: 'system', read: true, createdAt: new Date() }
        ],
        pages: 1,
        total: 2
      }
    }),
    markAsRead: vi.fn().mockResolvedValue({ success: true }),
    markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
    clearAll: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../../services/socket', () => ({
  connectSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

describe('Notifications Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notifications list', async () => {
    render(<Notifications />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Order Received')[0]).toBeDefined();
      expect(screen.getAllByText('System Update')[0]).toBeDefined();
    });
  });

  it('filters notifications by category', async () => {
    render(<Notifications />);
    
    await waitFor(() => screen.getAllByText('Order Received')[0]);

    const orderFilter = screen.getAllByRole('button', { name: /Orders/i })[0];
    fireEvent.click(orderFilter);

    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalledWith(1, 20, 'order');
    });
  });

  it('marks a notification as read', async () => {
    render(<Notifications />);
    
    await waitFor(() => screen.getAllByText('Order Received')[0]);

    const markReadBtn = screen.getByText(/Mark read/i);
    fireEvent.click(markReadBtn);

    await waitFor(() => {
      expect(notificationService.markAsRead).toHaveBeenCalledWith('n1');
    });
  });

  it('clears all notifications', async () => {
    render(<Notifications />);
    
    await waitFor(() => screen.getAllByText('Order Received')[0]);

    const clearBtn = screen.getByText(/Clear/i);
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(notificationService.clearAll).toHaveBeenCalled();
      expect(screen.getByText(/No notifications/i)).toBeDefined();
    });
  });
});
