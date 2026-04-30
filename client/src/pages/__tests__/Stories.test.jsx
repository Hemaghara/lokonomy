import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Stories from '../Stories';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storyService } from '../../services';

// Mock storyService
vi.mock('../../services', () => ({
  storyService: {
    getStories: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            _id: 's1',
            title: 'Community News',
            content: 'Something happened today!',
            type: 'News',
            likes: [],
            views: 10,
            shares: 2,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString()
          }
        ]
      }
    }),
    likeStory: vi.fn().mockResolvedValue({
      data: {
        data: {
          _id: 's1',
          likes: ['u1'], // user liked it
        }
      }
    }),
    shareStory: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Stories Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders community updates correctly', async () => {
    render(<Stories />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Community News')[0]).toBeDefined();
      expect(screen.getByText(/Something happened today!/i)).toBeDefined();
    });
  });

  it('filters stories by category', async () => {
    render(<Stories />);
    
    await waitFor(() => screen.getAllByText('Community News')[0]);

    const newsFilter = screen.getAllByRole('button', { name: /News/i })[0];
    fireEvent.click(newsFilter);

    await waitFor(() => {
      expect(storyService.getStories).toHaveBeenCalledWith(expect.objectContaining({
        type: 'News'
      }));
    });
  });

  it('handles liking a story', async () => {
    render(<Stories />);
    
    await waitFor(() => screen.getAllByText('Community News')[0]);

    const likeBtn = screen.getAllByRole('button', { name: /0/ })[0]; // Assuming initial likes is 0
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(storyService.likeStory).toHaveBeenCalledWith('s1');
    });
  });

  it('handles sharing a story', async () => {
    Object.assign(navigator, {
      share: vi.fn().mockResolvedValue(undefined),
    });

    render(<Stories />);
    
    await waitFor(() => screen.getAllByText('Community News')[0]);

    const shareBtn = screen.getAllByRole('button', { name: /2/ })[0]; // Assuming initial shares is 2
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(navigator.share).toHaveBeenCalled();
      expect(storyService.shareStory).toHaveBeenCalledWith('s1');
    });
  });
});
