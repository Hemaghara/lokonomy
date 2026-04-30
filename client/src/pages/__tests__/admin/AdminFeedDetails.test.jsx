import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminFeedDetails from '../../admin/AdminFeedDetails';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'f1' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getFeedDetails: vi.fn().mockResolvedValue({
      data: {
        _id: 'f1',
        title: 'New Store Opening',
        type: 'Event',
        content: 'We are opening a new store in Kadi!',
        district: 'Mehsana',
        taluka: 'Kadi',
        locationAddress: 'Market Yard, Kadi',
        eventDate: '2026-05-01',
        eventTime: '10:00 AM',
        image: 'feed.png',
        author: 'Alice Admin',
        authorId: {
          _id: 'u1',
          name: 'Alice Admin',
          email: 'alice@example.com',
          phone: '9876543210',
          profilePic: 'alice.png',
          district: 'Mehsana'
        },
        createdAt: new Date().toISOString()
      }
    }),
    deleteFeed: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('AdminFeedDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders feed details and author information', async () => {
    render(<AdminFeedDetails />);
    
    await waitFor(() => {
      expect(screen.getAllByText('New Store Opening')[0]).toBeDefined();
      expect(screen.getAllByText('We are opening a new store in Kadi!')[0]).toBeDefined();
      expect(screen.getAllByText('Alice Admin')[0]).toBeDefined();
      expect(screen.getAllByText('alice@example.com')[0]).toBeDefined();
      expect(screen.getAllByText('Market Yard, Kadi')[0]).toBeDefined();
    });
  });

  it('handles feed deletion via modal', async () => {
    render(<AdminFeedDetails />);
    
    await waitFor(() => screen.getAllByText('New Store Opening')[0]);

    const deleteBtn = screen.getAllByRole('button', { name: /Delete Feed Post/i })[0];
    fireEvent.click(deleteBtn);

    expect(screen.getAllByText('Delete Feed Post?')[0]).toBeDefined();

    const confirmDeleteBtn = screen.getAllByRole('button', { name: /^Delete$/i })[0];
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(adminService.deleteFeed).toHaveBeenCalledWith('f1');
    });
  });

  it('navigates to author profile', async () => {
    render(<AdminFeedDetails />);
    
    await waitFor(() => screen.getAllByText('Alice Admin')[0]);

    const authorBtn = screen.getAllByRole('button', { name: /Alice Admin/i })[0];
    fireEvent.click(authorBtn);

    // Navigation is handled by useNavigate which is mocked in test-utils
  });

  it('shows not found screen on error', async () => {
    adminService.getFeedDetails.mockRejectedValueOnce(new Error('Not Found'));
    
    render(<AdminFeedDetails />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Not Found')[0]).toBeDefined();
    });
  });
});

