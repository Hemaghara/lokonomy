import React from 'react';
import { render, screen, waitFor } from '../../utils/test-utils';
import AppliedJobs from '../AppliedJobs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jobService } from '../../services';

// Mock jobService
vi.mock('../../services', () => ({
  jobService: {
    getAppliedJobs: vi.fn().mockResolvedValue({
      data: [
        {
          jobId: 'job-1',
          position: 'Full Stack Developer',
          posterName: 'Tech Corp',
          district: 'Silicon Valley',
          location: 'HQ',
          salary: '$120k',
          jobType: 'Full-time',
          status: 'Interview',
          appliedAt: new Date().toISOString(),
          jobStatus: 'Open',
        }
      ]
    }),
  },
}));

describe('AppliedJobs Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page and displays job applications', async () => {
    render(<AppliedJobs />);
    
    expect(screen.getByText(/My Applications/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText(/Full Stack Developer/i)).toBeDefined();
      expect(screen.getByText(/Tech Corp/i)).toBeDefined();
      expect(screen.getByText(/Interview/i)).toBeDefined();
    });
  });

  it('displays empty state when no applications are found', async () => {
    jobService.getAppliedJobs.mockResolvedValueOnce({ data: [] });
    
    render(<AppliedJobs />);
    
    await waitFor(() => {
      expect(screen.getByText(/No applications yet/i)).toBeDefined();
      expect(screen.getByText(/Exlpore Jobs/i)).toBeDefined();
    });
  });

  it('shows warning when a job is closed', async () => {
    jobService.getAppliedJobs.mockResolvedValueOnce({
      data: [
        {
          jobId: 'job-2',
          position: 'Designer',
          jobStatus: 'Closed',
          status: 'Under Review',
          appliedAt: new Date().toISOString(),
        }
      ]
    });

    render(<AppliedJobs />);

    await waitFor(() => {
      expect(screen.getByText(/This job is no longer accepting new applications/i)).toBeDefined();
    });
  });
});
