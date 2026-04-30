import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import FeedDetails from '../FeedDetails';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { feedService } from '../../services';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'f1' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock services
vi.mock('../../services', () => ({
  feedService: {
    getFeedById: vi.fn().mockResolvedValue({
      data: {
        data: {
          _id: 'f1',
          title: 'Special Sale',
          content: 'Huge discounts on everything!',
          type: 'Sale',
          author: 'Store Owner',
          authorId: 'mock-user-id',
          locationAddress: 'Market Street',
          createdAt: new Date().toISOString(),
          image: 'sale.jpg'
        }
      }
    }),
    deleteFeed: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('FeedDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders feed details correctly', async () => {
    render(<FeedDetails />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Special Sale')[0]).toBeDefined();
      expect(screen.getByText(/Huge discounts/i)).toBeDefined();
      expect(screen.getAllByText('Store Owner')[0]).toBeDefined();
    }, { timeout: 5000 });
  });

  it('handles sharing a feed link', async () => {
    render(<FeedDetails />);
    
    await waitFor(() => screen.getAllByText('Special Sale')[0], { timeout: 5000 });

    const shareBtns = screen.getAllByRole('button', { name: /Share/i });
    fireEvent.click(shareBtns[0]);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(screen.getAllByText(/Copied!/i)[0]).toBeDefined();
    }, { timeout: 5000 });
  });

  it('allows owner to delete feed', async () => {
    window.confirm = vi.fn(() => true);
    render(<FeedDetails />);
    
    await waitFor(() => screen.getAllByText('Special Sale')[0], { timeout: 5000 });

    const deleteBtn = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(feedService.deleteFeed).toHaveBeenCalledWith('f1');
    }, { timeout: 5000 });
  });
});

