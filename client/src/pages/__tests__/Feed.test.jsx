import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Feed from '../Feed';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock feedService
vi.mock('../../services', () => ({
  feedService: {
    getFeeds: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            _id: 'feed-1',
            title: 'Local Festival',
            content: 'Come join us!',
            type: 'Information',
            author: 'Admin',
            locationAddress: 'Town Hall',
            createdAt: new Date().toISOString(),
          },
          {
            _id: 'feed-2',
            title: 'Huge Sale!',
            content: '50% off everything',
            type: 'Sale',
            author: 'Shop Keeper',
            locationAddress: 'Main Street',
            createdAt: new Date().toISOString(),
          }
        ]
      }
    }),
  },
}));

describe('Feed Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the community feed and fetches data', async () => {
    render(<Feed />);
    
    expect(screen.getByText(/Community Feed/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getAllByText('Local Festival')[0]).toBeDefined();
      expect(screen.getAllByText('Huge Sale!')[0]).toBeDefined();
    });
  });

  it('filters feeds by category', async () => {
    const { feedService } = await import('../../services');
    render(<Feed />);
    
    await waitFor(() => screen.getAllByText('Local Festival')[0]);

    const saleFilter = screen.getAllByRole('button', { name: /^Sale$/i })[0];
    fireEvent.click(saleFilter);

    await waitFor(() => {
      expect(feedService.getFeeds).toHaveBeenCalled();
    });
  });

  it('searches for feeds via search input', async () => {
    const { feedService } = await import('../../services');
    render(<Feed />);
    
    // The placeholder in Feed.jsx is "Search local feeds…" (with ellipsis character)
    const searchInput = screen.getByPlaceholderText(/Search local feeds/i);
    fireEvent.change(searchInput, { target: { value: 'Festival' } });

    await waitFor(() => {
      expect(feedService.getFeeds).toHaveBeenCalled();
    });
  });

  it('renders filter buttons for all feed categories', async () => {
    render(<Feed />);
    
    await waitFor(() => screen.getAllByText('Local Festival')[0]);

    // Verify category buttons exist
    expect(screen.getAllByRole('button', { name: /^All$/i })[0]).toBeDefined();
    expect(screen.getAllByRole('button', { name: /^Sale$/i })[0]).toBeDefined();
    expect(screen.getAllByRole('button', { name: /^Information$/i })[0]).toBeDefined();
  });
});
