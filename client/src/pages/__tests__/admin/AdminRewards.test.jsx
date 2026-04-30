import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminRewards from '../../admin/AdminRewards';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    adminService: {
      getRewardsStats: vi.fn().mockResolvedValue({
        data: {
          stats: {
            totalActivePoints: 5000,
            totalPointsEarned: 10000,
            totalPointsRedeemed: 5000,
            totalRedemptions: 150,
            activeUsers: 85
          }
        }
      }),
      getLoyaltyBalances: vi.fn().mockResolvedValue({
        data: {
          users: [
            {
              _id: 'u1',
              name: 'User One',
              email: 'user1@test.com',
              loyaltyPoints: 500,
              subscription: { plan: 'gold' },
              createdAt: new Date().toISOString()
            }
          ],
          pagination: { totalPages: 2 }
        }
      }),
      getRedemptionHistory: vi.fn().mockResolvedValue({
        data: {
          history: [
            {
              _id: 'h1',
              userName: 'User One',
              userEmail: 'user1@test.com',
              amount: -100,
              event: 'REDEMPTION',
              description: 'Bought discount voucher',
              createdAt: new Date().toISOString()
            }
          ],
          pagination: { totalPages: 1 }
        }
      }),
      updateLoyaltyPoints: vi.fn().mockResolvedValue({ data: { success: true } }),
    }
  };
});

describe('AdminRewards Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders rewards stats correctly', async () => {
    render(<AdminRewards />);
    
    await waitFor(() => {
      expect(screen.getAllByText('5,000').length).toBeGreaterThan(0);
      expect(screen.getAllByText('10,000').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Active Points')[0]).toBeInTheDocument();
    });
  });

  it('renders loyalty balances and handles point editing', async () => {
    render(<AdminRewards />);
    
    await waitFor(() => {
      expect(screen.getAllByText('User One')[0]).toBeInTheDocument();
      expect(screen.getAllByText('500')[0]).toBeInTheDocument();
    });

    // Start editing - use the aria-label we added
    const editBtn = screen.getAllByRole('button', { name: /Edit/i })[0];
    fireEvent.click(editBtn);

    const pointsInput = await screen.findByDisplayValue('500');
    fireEvent.change(pointsInput, { target: { value: '600' } });

    const reasonInput = screen.getByPlaceholderText(/Log entry reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Manual correction' } });

    const saveBtn = screen.getAllByRole('button', { name: /Save/i })[0];
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(adminService.updateLoyaltyPoints).toHaveBeenCalledWith('u1', {
        points: 600,
        reason: 'Manual correction'
      });
    });
  });

  it('switches to history tab and renders logs', async () => {
    render(<AdminRewards />);
    
    await waitFor(() => screen.getAllByText('User One')[0]);

    const historyBtn = screen.getAllByRole('button', { name: /Log/i })[0];
    fireEvent.click(historyBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Activity Ledger/i })).toBeInTheDocument();
      expect(screen.getAllByText(/-100/)[0]).toBeInTheDocument();
      expect(screen.getByText(/Bought discount voucher/i)).toBeInTheDocument();
    });
  });

  it('handles search filtering', async () => {
    render(<AdminRewards />);
    
    await waitFor(() => screen.getAllByText('User One')[0]);

    const searchInput = screen.getByPlaceholderText(/Search members/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

    await waitFor(() => {
      expect(screen.getByText(/No Results Found/i)).toBeInTheDocument();
    });
  });
});
