import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import FeedDetails from '../FeedDetails';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { feedService } from '../../services';
import { toast } from 'react-hot-toast';
import { useUser } from '../../context/UserContext';
// ...
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'f1' }),
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to} onClick={(e) => { e.preventDefault(); mockNavigate(to); }}>{children}</a>,
  };
});

// Mock UserContext
vi.mock('../../context/UserContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: vi.fn().mockReturnValue({ user: { id: 'u1' } }),
  };
});

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  toast: mockToast,
  Toaster: () => null,
}));

// Mock services
vi.mock('../../services', () => ({
  feedService: {
    getFeedById: vi.fn(),
    deleteFeed: vi.fn(),
    getRelatedFeeds: vi.fn().mockResolvedValue({ data: { data: [] } }),
    getComments: vi.fn().mockResolvedValue({ data: { data: [], totalPages: 0, totalCount: 0 } }),
  },
}));

const mockFeed = {
  _id: 'f1',
  title: 'Special Sale',
  content: 'Huge discounts on everything!',
  type: 'Sale',
  author: 'Store Owner',
  authorId: 'u1',
  locationAddress: 'Market Street',
  createdAt: new Date().toISOString(),
  image: 'sale.jpg'
};

describe('FeedDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feedService.getFeedById.mockResolvedValue({ data: { data: mockFeed } });
    feedService.deleteFeed.mockResolvedValue({ data: { success: true } });
    
    // Mock clipboard using vi.stubGlobal
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    
    // Mock window.confirm and document.execCommand
    vi.stubGlobal('confirm', vi.fn(() => true));
    document.execCommand = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows loading state initially', () => {
    feedService.getFeedById.mockReturnValue(new Promise(() => {}));
    render(<FeedDetails />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('renders feed details correctly', async () => {
    render(<FeedDetails />);
    
    await waitFor(() => {
      expect(screen.getByText('Special Sale')).toBeInTheDocument();
      expect(screen.getByText(/Huge discounts/i)).toBeInTheDocument();
      expect(screen.getAllByText('Store Owner')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Market Street')[0]).toBeInTheDocument();
    });
  });

  it('handles "Feed Not Found" state', async () => {
    feedService.getFeedById.mockResolvedValue({ data: { data: null } });
    render(<FeedDetails />);
    
    await waitFor(() => {
      expect(screen.getByText('Feed Not Found')).toBeInTheDocument();
    });
    
    const backBtn = screen.getByRole('button', { name: /Back to Feed/i });
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/feed');
  });

  it('handles API error on load', async () => {
    feedService.getFeedById.mockRejectedValue(new Error('Fetch failed'));
    render(<FeedDetails />);
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to load feed details');
    });
  });

  it('allows owner to delete feed', async () => {
    render(<FeedDetails />);
    await waitFor(() => screen.getByText('Special Sale'));

    const deleteBtn = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(feedService.deleteFeed).toHaveBeenCalledWith('f1');
      expect(mockToast.success).toHaveBeenCalledWith('Feed deleted successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/feed');
    });
  });

  it('does not show delete button for non-owner', async () => {
    // Override UserContext for this test
    vi.mocked(useUser).mockReturnValue({ user: { id: 'other-user' } });

    render(<FeedDetails />);
    await waitFor(() => screen.getByText('Special Sale'));

    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
  });

  it('handles sharing a feed link', async () => {
    render(<FeedDetails />);
    await waitFor(() => screen.getByText('Special Sale'));

    const shareBtn = screen.getByRole('button', { name: /Copy link to clipboard/i });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('Link copied to clipboard!');
      expect(screen.getAllByText(/Copied!/i)[0]).toBeInTheDocument();
    });
  });

  it('navigates back to feed via link', async () => {
    render(<FeedDetails />);
    await waitFor(() => screen.getByText(/Back to Feed/i));

    const backLink = screen.getByText(/Back to Feed/i);
    fireEvent.click(backLink);
    expect(mockNavigate).toHaveBeenCalledWith('/feed');
  });

  it('shows placeholder when image is missing', async () => {
    feedService.getFeedById.mockResolvedValue({ data: { data: { ...mockFeed, image: null } } });
    render(<FeedDetails />);
    
    await waitFor(() => {
      expect(screen.getByText('No image available')).toBeInTheDocument();
    });
  });
});
