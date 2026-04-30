import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminReferrals from '../../admin/AdminReferrals';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getAllReferrals: vi.fn().mockResolvedValue({
      data: {
        referrals: [
          {
            _id: 'r1',
            name: 'Referrer One',
            email: 'ref1@test.com',
            referralCode: 'REF100',
            referralRewards: { totalReferrals: 10, appliedDays: 5 },
            createdAt: new Date().toISOString()
          }
        ],
        pagination: { pages: 2, total: 15 },
        stats: { totalReferralsMade: 50 }
      }
    }),
    getTopReferrers: vi.fn().mockResolvedValue({
      data: {
        topReferrers: [
          {
            _id: 't1',
            name: 'Top User',
            email: 'top@test.com',
            referralCode: 'TOP123',
            referralRewards: { totalReferrals: 100, appliedDays: 30 }
          }
        ]
      }
    }),
    getReferralLeaderboard: vi.fn().mockResolvedValue({
      data: {
        leaderboard: [
          {
            _id: 'l1',
            name: 'Winner',
            email: 'win@test.com',
            referralCode: 'WINNER',
            referralRewards: { totalReferrals: 500, appliedDays: 100 }
          }
        ],
        pagination: { pages: 1 }
      }
    }),
  }
}));

describe('AdminReferrals Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders referral stats and list', async () => {
    render(<AdminReferrals />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Referrer One')[0]).toBeDefined();
      expect(screen.getAllByText('REF100')[0]).toBeDefined();
      expect(screen.getAllByText('Active Referral Codes')[0]).toBeDefined();
      expect(screen.getAllByText('15')[0]).toBeDefined(); // totalCount
    });
  });

  it('switches to top referrers tab', async () => {
    render(<AdminReferrals />);
    
    await waitFor(() => screen.getAllByText('Referrer One')[0]);

    const topTab = screen.getAllByRole('button', { name: /Top Referrers/i })[0];
    fireEvent.click(topTab);

    await waitFor(() => {
      expect(screen.getAllByText('Top User')[0]).toBeDefined();
      expect(adminService.getTopReferrers).toHaveBeenCalled();
    });
  });

  it('switches to leaderboard tab', async () => {
    render(<AdminReferrals />);
    
    await waitFor(() => screen.getAllByText('Referrer One')[0]);

    const leaderTab = screen.getAllByRole('button', { name: /Leaderboard/i })[0];
    fireEvent.click(leaderTab);

    await waitFor(() => {
      expect(screen.getAllByText('Winner')[0]).toBeDefined();
      expect(adminService.getReferralLeaderboard).toHaveBeenCalled();
    });
  });

  it('handles pagination', async () => {
    render(<AdminReferrals />);
    
    await waitFor(() => screen.getAllByText('Referrer One')[0]);

    const nextBtn = screen.getByLabelText(/Next page/i);
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(adminService.getAllReferrals).toHaveBeenCalledWith(expect.objectContaining({
        page: 2
      }));
    });
  });
});

