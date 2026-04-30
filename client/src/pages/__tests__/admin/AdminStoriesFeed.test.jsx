import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminStoriesFeed from '../../admin/AdminStoriesFeed';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';
import { useConfirm } from '../../../context/ConfirmContext';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getStoriesFeedStats: vi.fn().mockResolvedValue({
      data: {
        totalStories: 10,
        totalFeeds: 5,
        storyTypes: { News: 5 },
        feedTypes: { Sale: 2 }
      }
    }),
    getStories: vi.fn().mockResolvedValue({
      data: {
        stories: [
          {
            _id: 's1',
            title: 'Cool Story',
            content: 'Once upon a time...',
            type: 'News',
            author: 'Jane Doe',
            createdAt: new Date().toISOString()
          }
        ],
        totalPages: 1
      }
    }),
    getFeeds: vi.fn().mockResolvedValue({
      data: {
        feeds: [
          {
            _id: 'f1',
            title: 'Community Offer',
            content: 'Get 50% off',
            type: 'Sale',
            author: 'John Smith',
            createdAt: new Date().toISOString()
          }
        ],
        totalPages: 1
      }
    }),
    deleteStory: vi.fn().mockResolvedValue({ data: { success: true } }),
    deleteFeed: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

// Mock Confirm Context
vi.mock('../../../context/ConfirmContext', () => ({
  useConfirm: vi.fn(),
  ConfirmProvider: ({ children }) => <div>{children}</div>
}));

describe('AdminStoriesFeed Page', () => {
  const mockConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useConfirm.mockReturnValue(mockConfirm);
  });

  it('renders stories by default', async () => {
    render(<AdminStoriesFeed />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Cool Story')[0]).toBeDefined();
      expect(screen.getAllByText('Jane Doe')[0]).toBeDefined();
    });
  });

  it('switches to community feed tab', async () => {
    render(<AdminStoriesFeed />);
    
    await waitFor(() => screen.getAllByText('Cool Story')[0]);

    const communityTab = screen.getAllByRole('button', { name: /Community Feed/i })[0];
    fireEvent.click(communityTab);

    await waitFor(() => {
      expect(screen.getAllByText('Community Offer')[0]).toBeDefined();
      expect(screen.getAllByText('John Smith')[0]).toBeDefined();
    });
  });

  it('handles story deletion', async () => {
    mockConfirm.mockResolvedValue(true);
    render(<AdminStoriesFeed />);
    
    await waitFor(() => screen.getAllByText('Cool Story')[0]);

    const deleteBtn = screen.getAllByRole('button', { name: /Delete Content/i })[0];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(adminService.deleteStory).toHaveBeenCalledWith('s1');
    });
  });

  it('filters by search', async () => {
    render(<AdminStoriesFeed />);
    
    await waitFor(() => screen.getAllByText('Cool Story')[0]);

    const searchInput = screen.getByPlaceholderText(/Search stories/i);
    fireEvent.change(searchInput, { target: { value: 'Awesome' } });

    // Wait for debounce
    await waitFor(() => {
      expect(adminService.getStories).toHaveBeenCalledWith(expect.objectContaining({
        search: 'Awesome'
      }));
    }, { timeout: 1000 });
  });
});

