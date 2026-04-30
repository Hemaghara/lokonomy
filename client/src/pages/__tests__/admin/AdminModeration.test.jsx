import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminModeration from '../../admin/AdminModeration';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';
import { useConfirm } from '../../../context/ConfirmContext';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getModerationReports: vi.fn().mockResolvedValue({
      data: {
        reports: [
          {
            _id: 'r1',
            targetType: 'product',
            targetId: 'p1',
            reason: 'Inappropriate content',
            description: 'This product contains offensive language',
            status: 'pending',
            createdAt: new Date().toISOString(),
            reportedBy: { name: 'User X' }
          }
        ]
      }
    }),
    getReportedContent: vi.fn().mockResolvedValue({
      data: {
        targetType: 'product',
        content: { title: 'Bad Product', description: 'Offensive description' }
      }
    }),
    resolveReport: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

// Mock Confirm Context
vi.mock('../../../context/ConfirmContext', () => ({
  useConfirm: vi.fn(),
  ConfirmProvider: ({ children }) => <div>{children}</div>
}));

describe('AdminModeration Page', () => {
  const mockConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useConfirm.mockReturnValue(mockConfirm);
  });

  it('renders pending reports correctly', async () => {
    render(<AdminModeration />);
    
    await waitFor(() => {
      expect(screen.getByText(/Inappropriate content/i)).toBeDefined();
      expect(screen.getByText(/Reported product/i)).toBeDefined();
    });
  });

  it('shows content preview on eye icon click', async () => {
    render(<AdminModeration />);
    
    await waitFor(() => screen.getByText(/Inappropriate content/i));

    const previewBtn = screen.getByTitle('Preview content');
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(adminService.getReportedContent).toHaveBeenCalledWith('r1');
      expect(screen.getAllByText('Bad Product')[0]).toBeDefined();
    });
  });

  it('handles report resolution (warn)', async () => {
    mockConfirm.mockResolvedValue(true);
    render(<AdminModeration />);
    
    await waitFor(() => screen.getByText(/Inappropriate content/i));

    const warnBtn = screen.getAllByRole('button', { name: /Warn/i })[0];
    fireEvent.click(warnBtn);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(adminService.resolveReport).toHaveBeenCalledWith('r1', expect.objectContaining({
        action: 'warned',
        status: 'resolved'
      }));
    });
  });

  it('handles bulk actions', async () => {
    mockConfirm.mockResolvedValue(true);
    render(<AdminModeration />);
    
    await waitFor(() => screen.getByText(/Inappropriate content/i));

    const selectAll = screen.getByLabelText(/Select All/i);
    fireEvent.click(selectAll);

    const bulkWarnBtn = screen.getAllByRole('button', { name: /Warn All/i })[0];
    fireEvent.click(bulkWarnBtn);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(adminService.resolveReport).toHaveBeenCalled();
    });
  });
});

