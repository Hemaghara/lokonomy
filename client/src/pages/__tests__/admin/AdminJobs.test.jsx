import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminJobs from '../../admin/AdminJobs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getJobs: vi.fn().mockResolvedValue({
      data: {
        jobs: [
          {
            _id: 'j1',
            position: 'Software Engineer',
            location: 'Mumbai',
            district: 'Mumbai City',
            status: 'Open',
            salary: '₹50,000',
            vacancies: 2,
            education: 'Graduate',
            posterName: 'Tech Corp',
            applications: [{}, {}],
            isFlagged: false,
            isSuspended: false
          }
        ],
        totalPages: 1
      }
    }),
    getJobStats: vi.fn().mockResolvedValue({
      data: {
        totalJobs: 100,
        openJobs: 80,
        closedJobs: 10,
        bannedJobs: 5,
        suspendedJobs: 5,
        totalApplications: 250
      }
    }),
    toggleBanJob: vi.fn().mockResolvedValue({ data: { message: 'Job status updated' } }),
    toggleSuspendJob: vi.fn().mockResolvedValue({ data: { message: 'Job status updated' } }),
  }
}));

describe('AdminJobs Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders job stats and job list', async () => {
    render(<AdminJobs />);
    
    await waitFor(() => {
      expect(screen.getAllByText('100')[0]).toBeDefined(); // Total Jobs stat
      expect(screen.getAllByText('Software Engineer')[0]).toBeDefined();
    });
  });

  it('filters jobs by status', async () => {
    render(<AdminJobs />);
    
    await waitFor(() => screen.getAllByText('Software Engineer')[0]);

    const openFilter = screen.getAllByRole('button', { name: /^open$/i })[0];
    fireEvent.click(openFilter);

    await waitFor(() => {
      expect(adminService.getJobs).toHaveBeenCalledWith(expect.objectContaining({
        status: 'open'
      }));
    });
  });

  it('handles job banning', async () => {
    render(<AdminJobs />);
    
    await screen.findByText(/Software Engineer/i);
    const banBtn = screen.getByRole('button', { name: /^Ban$/i });
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(adminService.toggleBanJob).toHaveBeenCalledWith('j1');
    });
    // toast is mocked in vitest.setup.js
    const { toast } = await import('react-hot-toast');
    expect(toast.success).toHaveBeenCalledWith('Job status updated');
  });

  it('handles job suspension', async () => {
    render(<AdminJobs />);
    
    await screen.findByText(/Software Engineer/i);

    const suspendBtn = screen.getByRole('button', { name: /^Suspend$/i });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(adminService.toggleSuspendJob).toHaveBeenCalledWith('j1');
    });
  });
});
