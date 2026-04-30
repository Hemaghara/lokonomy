import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Rewards from '../Rewards';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rewardsService } from '../../services';

// Mock rewardsService
vi.mock('../../services', () => ({
  rewardsService: {
    getBalance: vi.fn().mockResolvedValue({
      data: {
        success: true,
        points: 500,
        history: [
          { event: 'daily_login', amount: 5, type: 'earn', createdAt: new Date().toISOString() },
          { event: 'redeem_coupon', amount: 100, type: 'redeem', createdAt: new Date().toISOString() }
        ]
      }
    }),
    getOptions: vi.fn().mockResolvedValue({
      data: {
        success: true,
        options: [
          { id: 'o1', name: '50% Off Coupon', type: 'coupon', cost: 100, description: 'Get 50% off your next purchase.' },
          { id: 'o2', name: 'Gold Plan Upgrade', type: 'upgrade', cost: 1000, description: 'Unlock premium features.', plan: 'gold' }
        ]
      }
    }),
    claimDailyLogin: vi.fn().mockResolvedValue({
      data: { success: true, points: 505, message: 'Daily bonus claimed!' }
    }),
    redeem: vi.fn().mockResolvedValue({
      data: { success: true, points: 400, message: 'Redeemed successfully!' }
    }),
  }
}));

describe('Rewards Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set points in local storage so UserContext picks it up
    localStorage.setItem('lokonomy_user', JSON.stringify({
      id: 'mock-user-id',
      name: 'Test User',
      loyaltyPoints: 500
    }));
  });


  it('renders points balance and tier correctly', async () => {
    render(<Rewards />);
    
    await waitFor(() => {
      expect(screen.getAllByText('500')[0]).toBeDefined();
      expect(screen.getAllByText('Gold')[0]).toBeDefined(); // Tier based on 500 points
    });
  });

  it('handles claiming daily login bonus', async () => {
    render(<Rewards />);
    
    await waitFor(() => screen.getAllByText('500')[0]);

    const claimBtn = screen.getByRole('button', { name: /Claim Daily Login/i });
    fireEvent.click(claimBtn);

    await waitFor(() => {
      expect(rewardsService.claimDailyLogin).toHaveBeenCalled();
      expect(screen.getByText(/Daily bonus claimed!/i)).toBeInTheDocument();
    });
  });

  it('handles redeeming a reward', async () => {
    render(<Rewards />);
    
    await waitFor(() => screen.getAllByText('500')[0]);

    const redeemBtn = screen.getByLabelText(/Redeem 50% Off Coupon/i);
    fireEvent.click(redeemBtn);

    await waitFor(() => {
      expect(rewardsService.redeem).toHaveBeenCalledWith('o1');
      expect(screen.getByText(/Redeemed successfully!/i)).toBeInTheDocument();
    });
  });

  it('shows error if not enough points to redeem', async () => {
    render(<Rewards />);
    
    await waitFor(() => screen.getAllByText('500')[0]);

    // Upgrade cost is 1000, balance is 500
    const needPointsText = screen.getByText(/Need 500 more pts/i);
    expect(needPointsText).toBeDefined();
    
    const disabledBtn = needPointsText.closest('button');
    expect(disabledBtn).toBeDisabled();
  });
});
