import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminContentSchedule from '../../admin/AdminContentSchedule';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getScheduledContent: vi.fn().mockResolvedValue({
      data: {
        scheduledStories: [
          {
            _id: 's1',
            title: 'Summer Launch',
            author: { name: 'Admin User' },
            scheduledAt: new Date(Date.now() + 86400000).toISOString() // Tomorrow
          }
        ],
        pinnedFeeds: [
          {
            _id: 'f1',
            caption: 'Important Update!',
            author: { name: 'Jane Doe' },
            pinnedAt: new Date().toISOString()
          }
        ],
        expiringStories: [
          {
            _id: 's2',
            title: 'Flash Sale',
            author: { name: 'Admin User' },
            expiresAt: new Date(Date.now() + 3600000).toISOString() // In 1 hour
          }
        ]
      }
    }),
    togglePinFeed: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('AdminContentSchedule Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders scheduled stories, pinned posts, and expiring content', async () => {
    render(<AdminContentSchedule />);
    
    await screen.findByText(/Summer Launch/i);
    expect(screen.getAllByText(/Admin User/i)[0]).toBeDefined();
    
    // Pinned Posts
    expect(screen.getAllByText(/Important Update!/i)[0]).toBeDefined();
    expect(screen.getAllByText(/Jane Doe/i)[0]).toBeDefined();
    
    // Expiring Soon
    expect(screen.getAllByText(/Flash Sale/i)[0]).toBeDefined();
    expect(screen.getAllByText(/Story Title/i)[0]).toBeDefined();
  });

  it('handles unpinning a post', async () => {
    render(<AdminContentSchedule />);
    
    await screen.findByText(/Important Update!/i);

    const unpinBtn = screen.getAllByRole('button', { name: /Unpin Post/i })[0];
    fireEvent.click(unpinBtn);

    await waitFor(() => {
      expect(adminService.togglePinFeed).toHaveBeenCalledWith('f1');
    });
  });

  it('handles manual refresh', async () => {
    render(<AdminContentSchedule />);
    await screen.findByText(/Summer Launch/i);
    const refreshBtn = screen.getAllByRole('button', { name: /Refresh/i })[0];
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(adminService.getScheduledContent).toHaveBeenCalledTimes(2);
    });
  });

  it('shows empty states correctly', async () => {
    adminService.getScheduledContent.mockResolvedValueOnce({
      data: {
        scheduledStories: [],
        pinnedFeeds: [],
        expiringStories: []
      }
    });

    render(<AdminContentSchedule />);
    
    await waitFor(() => {
      expect(screen.getAllByText('No stories scheduled for future release')[0]).toBeDefined();
      expect(screen.getAllByText('No feed posts pinned currently')[0]).toBeDefined();
      expect(screen.getAllByText('No stories expiring in the next 7 days')[0]).toBeDefined();
    });
  });
});
