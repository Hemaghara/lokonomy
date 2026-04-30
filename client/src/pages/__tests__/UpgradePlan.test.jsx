import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import UpgradePlan from '../UpgradePlan';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscriptionService, referralService } from '../../services';

// Mock services
vi.mock('../../services', () => ({
  subscriptionService: {
    getPlans: vi.fn().mockResolvedValue({
      data: {
        success: true,
        plans: {
          silver: { prices: { 3: 199 }, limits: { productsUploaded: 20 } },
          gold: { prices: { 3: 399 }, limits: { productsUploaded: 100 } },
          platinum: { prices: { 3: 799 }, limits: { productsUploaded: 'Unlimited' } },
        }
      }
    }),
    getStatus: vi.fn().mockResolvedValue({
      data: {
        subscription: { plan: 'free', isActive: false },
        limits: { productsUpload: 3, storiesPost: 5 },
        usage: { productsUploaded: 1, storiesPosted: 0 }
      }
    }),
    createOrder: vi.fn().mockResolvedValue({
      data: { orderId: 'ord_123', amount: 199, currency: 'INR', keyId: 'rzp_test' }
    }),
    verifyPayment: vi.fn().mockResolvedValue({ data: { success: true, user: {} } }),
    logFailedPayment: vi.fn(),
  },
  referralService: {
    validateReferralCode: vi.fn().mockResolvedValue({
      data: { success: true, referralCode: 'LOKO-123' }
    }),
  }
}));

describe('UpgradePlan Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  it('renders current plan status and available plans', async () => {
    render(<UpgradePlan />);
    
    await waitFor(() => {
      expect(screen.getByText(/Current Plan/i)).toBeDefined();
      expect(screen.getAllByText('Silver')[0]).toBeDefined();
      expect(screen.getAllByText('Gold')[0]).toBeDefined();
      expect(screen.getAllByText('Platinum')[0]).toBeDefined();
    });
  });

  it('validates referral code', async () => {
    render(<UpgradePlan />);
    
    await waitFor(() => screen.getByPlaceholderText(/e.g. LOKO-AB12/i));

    const input = screen.getByPlaceholderText(/e.g. LOKO-AB12/i);
    fireEvent.change(input, { target: { value: 'LOKO-123' } });
    
    const applyBtn = screen.getAllByRole('button', { name: /Apply/i })[0];
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(referralService.validateReferralCode).toHaveBeenCalledWith('LOKO-123');
      expect(screen.getAllByText(/Applied! 15% discount unlocked/i)[0]).toBeDefined();
    });
  });

  it('changes plan duration', async () => {
    render(<UpgradePlan />);
    
    await waitFor(() => screen.getAllByText('6 Months')[0]);

    const sixMonthsBtn = screen.getAllByText('6 Months')[0];
    fireEvent.click(sixMonthsBtn);

    // Prices should update (handled by component state)
  });

  it('initiates purchase flow', async () => {
    // Mock Razorpay
    window.Razorpay = vi.fn().mockImplementation(() => ({
      open: vi.fn(),
      on: vi.fn(),
    }));

    render(<UpgradePlan />);
    
    await waitFor(() => screen.getAllByText('Silver')[0]);

    const silverBtn = screen.getAllByRole('button', { name: /Get Silver/i })[0];
    fireEvent.click(silverBtn);

    await waitFor(() => {
      expect(subscriptionService.createOrder).toHaveBeenCalledWith('silver', 3);
    });
  });
});
