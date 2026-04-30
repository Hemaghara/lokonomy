import React from 'react';
import { render, screen, waitFor } from '../../../utils/test-utils';
import AdminChats from '../../admin/AdminChats';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getChatStats: vi.fn().mockResolvedValue({
      data: {
        totalMessages: 1500,
        messagesToday: 45,
        activeRooms: 12,
        chatTypeStats: [
          { _id: 'Direct Message', count: 1000 },
          { _id: 'Business Inquiry', count: 500 }
        ]
      }
    }),
    getReportedChats: vi.fn().mockResolvedValue({
      data: [
        {
          _id: 'rep1',
          reason: 'Spamming',
          reportedBy: { name: 'Alice' },
          createdAt: new Date().toISOString()
        }
      ]
    }),
  }
}));

describe('AdminChats Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat stats and reported conversations', async () => {
    render(<AdminChats />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/1500/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/45/)[0]).toBeInTheDocument();
      expect(screen.getByText(/Spamming/i)).toBeInTheDocument();
      expect(screen.getByText(/Reported by: Alice/i)).toBeInTheDocument();
    });
  });

  it('renders chat distribution bars', async () => {
    render(<AdminChats />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Direct Message')[0]).toBeInTheDocument();
      expect(screen.getAllByText('1000 msgs')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Business Inquiry')[0]).toBeInTheDocument();
      expect(screen.getAllByText('500 msgs')[0]).toBeInTheDocument();
    });
  });

  it('shows empty state when no reports', async () => {
    adminService.getReportedChats.mockResolvedValueOnce({ data: [] });
    
    render(<AdminChats />);
    
    await waitFor(() => {
      expect(screen.getAllByText('No chat reports')[0]).toBeInTheDocument();
    });
  });
});
