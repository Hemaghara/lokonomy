import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminFraudDetection from '../../admin/AdminFraudDetection';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getFraudSignals: vi.fn().mockResolvedValue({
      data: {
        total: 5,
        critical: 1,
        high: 2,
        medium: 2,
        signals: [
          {
            title: 'Review Bombing Detected',
            detail: 'Sudden spike in 1-star reviews for Cafe One',
            severity: 'critical',
            type: 'review_bombing',
            riskScore: 90,
            entities: [{ name: 'Cafe One' }],
            actionPath: '/admin/reviews/b1'
          },
          {
            title: 'Multiple Accounts',
            detail: 'Shared phone number across 3 accounts',
            severity: 'medium',
            type: 'duplicate_phone',
            riskScore: 45,
            entities: [{ name: 'User A' }, { name: 'User B' }],
            actionPath: '/admin/users/u1'
          }
        ]
      }
    })
  }
}));

describe('AdminFraudDetection Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fraud stats and signals', async () => {
    render(<AdminFraudDetection />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Review Bombing Detected')[0]).toBeDefined();
    });
  });

  it('renders signal details', async () => {
    render(<AdminFraudDetection />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Review Bombing Detected')[0]).toBeDefined();
      expect(screen.getByText(/Sudden spike/i)).toBeDefined();
    });
  });

  it('filters signals by severity', async () => {
    render(<AdminFraudDetection />);
    
    await waitFor(() => screen.getAllByText('Review Bombing Detected')[0]);

    const mediumBtn = screen.getAllByRole('button', { name: /medium/i })[0];
    fireEvent.click(mediumBtn);

    await waitFor(() => {
      expect(screen.queryByText('Review Bombing Detected')).toBeNull();
      expect(screen.getAllByText('Multiple Accounts')[0]).toBeDefined();
    });
  });

  it('handles review button click', async () => {
    render(<AdminFraudDetection />);
    
    await waitFor(() => screen.getAllByText('Review Bombing Detected')[0]);

    const reviewBtns = screen.getAllByRole('button', { name: /Review/i });
    expect(reviewBtns.length).toBeGreaterThan(0);
    fireEvent.click(reviewBtns[0]);
    // Navigation is handled internally, just verify no crash
  });
});
