import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import StoryDetails from '../StoryDetails';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storyService } from '../../services';

// Mock storyService
vi.mock('../../services', () => ({
  storyService: {
    getStoryById: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          _id: 'story123',
          title: 'Community Garden Cleanup',
          content: 'Join us this Saturday for a cleanup event.',
          author: 'Green Thumb',
          type: 'Events',
          createdAt: new Date().toISOString(),
          views: 42,
          locationAddress: '123 Park Ave'
        }
      }
    }),
  },
}));

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

describe('StoryDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders story details correctly', async () => {
    render(<StoryDetails />);
    
    await waitFor(() => {
      expect(screen.getByText(/Community Garden Cleanup/i)).toBeDefined();
      expect(screen.getByText(/Green Thumb/i)).toBeDefined();
    });
  });

  it('handles sharing a story', async () => {
    render(<StoryDetails />);
    
    await waitFor(() => screen.getByText(/Community Garden Cleanup/i));

    const shareBtn = screen.getByRole('button', { name: /^Share$/ });
    fireEvent.click(shareBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    // Two "copied" buttons exist (top-right "Copied!" + bottom "Link Copied!") — use All variant
    const copiedBtns = await screen.findAllByRole('button', { name: /Copied!/i });
    expect(copiedBtns.length).toBeGreaterThan(0);
  });
});
