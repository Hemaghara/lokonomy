import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import UserSupport from '../UserSupport';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';

// Mock api
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        tickets: [
          {
            _id: 't1',
            subject: 'Login Issue',
            description: 'Cannot login to account',
            status: 'open',
            category: 'technical',
            priority: 'high',
            ticketNumber: 'TIC123'
          }
        ]
      }
    }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('UserSupport Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders my tickets correctly', async () => {
    render(<UserSupport />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Login Issue')[0]).toBeDefined();
      expect(screen.getByText(/#TIC123/i)).toBeDefined();
    });
  });

  it('toggles between ticket list and creation form', async () => {
    render(<UserSupport />);
    
    await waitFor(() => screen.getAllByText('Login Issue')[0]);

    const raiseBtn = screen.getAllByRole('button', { name: /Raise a Ticket/i })[0];
    fireEvent.click(raiseBtn);

    expect(screen.getByPlaceholderText(/Briefly describe the issue/i)).toBeDefined();
    expect(screen.getAllByRole('button', { name: /Submit Ticket/i })[0]).toBeDefined();

    const viewBtn = screen.getAllByRole('button', { name: /View My Tickets/i })[0];
    fireEvent.click(viewBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Login Issue')[0]).toBeDefined();
    });
  });

  it('handles ticket creation', async () => {
    render(<UserSupport />);
    
    fireEvent.click(screen.getAllByRole('button', { name: /Raise a Ticket/i })[0]);

    fireEvent.change(screen.getByPlaceholderText(/Briefly describe the issue/i), {
      target: { value: 'New Problem' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Tell us more/i), {
      target: { value: 'Detailed explanation of problem' }
    });

    const submitBtn = screen.getAllByRole('button', { name: /Submit Ticket/i })[0];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/support/create', expect.objectContaining({
        subject: 'New Problem',
        description: 'Detailed explanation of problem'
      }));
    });
  });
});
