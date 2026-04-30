import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminBusinessVerification from '../../admin/AdminBusinessVerification';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';
import { useConfirm } from '../../../context/ConfirmContext';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getPendingVerifications: vi.fn().mockResolvedValue({
      data: {
        businesses: [
          {
            _id: 'b1',
            businessName: 'Bakery One',
            category: 'Bakery',
            verificationStatus: 'pending',
            createdAt: new Date().toISOString(),
            ownerId: { name: 'Owner A', email: 'owner@a.com' },
            address: '123 Main St',
            contactNumber: '1234567890',
            kycDocuments: ['doc1.jpg']
          }
        ],
        stats: { pending: 1, under_review: 0, verified: 10, rejected: 2 }
      }
    }),
    approveBusiness: vi.fn().mockResolvedValue({ data: { success: true } }),
    rejectBusiness: vi.fn().mockResolvedValue({ data: { success: true } }),
    markVerificationUnderReview: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

// Mock Confirm Context
vi.mock('../../../context/ConfirmContext', () => ({
  useConfirm: vi.fn(),
  ConfirmProvider: ({ children }) => <div>{children}</div>
}));

describe('AdminBusinessVerification Page', () => {
  const mockConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useConfirm.mockReturnValue(mockConfirm);
  });

  it('renders verification queue and stats', async () => {
    render(<AdminBusinessVerification />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Bakery One')[0]).toBeDefined();
      expect(screen.getAllByText('Pending')[0]).toBeDefined();
    });
  });

  it('selects a business and shows details', async () => {
    render(<AdminBusinessVerification />);
    
    await waitFor(() => screen.getAllByText('Bakery One')[0]);

    fireEvent.click(screen.getAllByText('Bakery One')[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Verification Documents')[0]).toBeDefined();
      expect(screen.getAllByText('123 Main St')[0]).toBeDefined();
    });
  });

  it('handles business approval', async () => {
    mockConfirm.mockResolvedValue(true);
    render(<AdminBusinessVerification />);
    
    await waitFor(() => screen.getAllByText('Bakery One')[0]);
    fireEvent.click(screen.getAllByText('Bakery One')[0]);

    await waitFor(() => screen.getAllByRole('button', { name: /Approve & Verify/i })[0]);

    const approveBtn = screen.getAllByRole('button', { name: /Approve & Verify/i })[0];
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(adminService.approveBusiness).toHaveBeenCalledWith('b1');
    });
  });

  it('handles business rejection with reason', async () => {
    render(<AdminBusinessVerification />);
    
    await waitFor(() => screen.getAllByText('Bakery One')[0]);
    fireEvent.click(screen.getAllByText('Bakery One')[0]);

    await waitFor(() => screen.getAllByRole('button', { name: /Reject Verification/i })[0]);

    const rejectBtn = screen.getAllByRole('button', { name: /Reject Verification/i })[0];
    fireEvent.click(rejectBtn);

    // Rejection modal should show
    await waitFor(() => screen.getByPlaceholderText(/e.g. Identity documents are blurred/i));

    const reasonInput = screen.getByPlaceholderText(/e.g. Identity documents are blurred/i);
    fireEvent.change(reasonInput, { target: { value: 'Invalid documents' } });

    const confirmRejectBtn = screen.getAllByRole('button', { name: /Confirm Rejection/i })[0];
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(adminService.rejectBusiness).toHaveBeenCalledWith('b1', 'Invalid documents');
    });
  });
});

