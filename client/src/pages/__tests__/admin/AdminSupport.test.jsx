import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminSupport from '../../admin/AdminSupport';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock AdminLayout
vi.mock('../../../layouts/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => React.createElement('div', { 'data-testid': 'admin-layout' }, children)
}));

// Mock adminService
vi.mock('../../../services', () => {
  const mockTicketData = {
    data: {
      tickets: [
        {
          _id: 't1',
          ticketNumber: 'TIC123',
          subject: 'Login Issue',
          description: 'Help with login',
          status: 'open',
          priority: 'high',
          category: 'technical',
          userName: 'John Doe',
          createdAt: new Date().toISOString(),
          replies: []
        }
      ],
      stats: { open: 1, in_progress: 0, urgent: 1, resolved: 0 }
    }
  };

  const mockTicketDetail = {
    data: {
      _id: 't1',
      ticketNumber: 'TIC123',
      subject: 'Login Issue',
      description: 'Help with login',
      status: 'open',
      priority: 'high',
      category: 'technical',
      userName: 'John Doe',
      createdAt: new Date().toISOString(),
      replies: [{ sender: 'user', senderName: 'John', message: 'Hello', createdAt: new Date().toISOString() }]
    }
  };

  return {
    adminService: {
      getSupportTickets: vi.fn().mockResolvedValue(mockTicketData),
      getSubAdmins: vi.fn().mockResolvedValue({ data: { data: [{ _id: 'a1', name: 'Admin One' }] } }),
      getTicketById: vi.fn().mockResolvedValue(mockTicketDetail),
      updateTicketStatus: vi.fn().mockResolvedValue({ data: { success: true } }),
      replyToTicket: vi.fn().mockResolvedValue({ data: { success: true } }),
      assignTicket: vi.fn().mockResolvedValue({ data: { success: true } }),
    }
  };
});

describe('AdminSupport Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ticket stats and ticket list', async () => {
    render(<AdminSupport />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Open Tickets')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Login Issue')[0]).toBeInTheDocument();
    });
  });

  it('selects a ticket and shows details', async () => {
    render(<AdminSupport />);
    
    await waitFor(() => screen.getAllByText('Login Issue')[0]);

    fireEvent.click(screen.getAllByText('Login Issue')[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Original Request')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Help with login')[0]).toBeInTheDocument();
    });
  });

  it('handles ticket status update to resolved', async () => {
    render(<AdminSupport />);
    
    await waitFor(() => screen.getAllByText('Login Issue')[0]);
    fireEvent.click(screen.getAllByText('Login Issue')[0]);

    await waitFor(() => screen.getAllByRole('button', { name: /Resolve/i })[0]);

    const resolveBtn = screen.getAllByRole('button', { name: /Resolve/i })[0];
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(adminService.updateTicketStatus).toHaveBeenCalledWith('t1', 'resolved');
    });
  });

  it('handles ticket reply', async () => {
    render(<AdminSupport />);
    
    await waitFor(() => screen.getAllByText('Login Issue')[0]);
    fireEvent.click(screen.getAllByText('Login Issue')[0]);

    await waitFor(() => screen.getByPlaceholderText(/Type your reply here/i));

    const replyInput = screen.getByPlaceholderText(/Type your reply here/i);
    fireEvent.change(replyInput, { target: { value: 'Working on it' } });

    // Find send button - it's the one with the FiSend icon (last button in the send area)
    const allBtns = screen.getAllByRole('button');
    const sendBtnActual = allBtns[allBtns.length - 1];
    fireEvent.click(sendBtnActual);

    await waitFor(() => {
      expect(adminService.replyToTicket).toHaveBeenCalledWith('t1', 'Working on it');
    });
  });
});
