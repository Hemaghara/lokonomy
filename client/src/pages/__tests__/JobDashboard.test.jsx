import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import JobDashboard from '../JobDashboard';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jobService } from '../../services';

// Mock jobService
vi.mock('../../services', () => ({
  jobService: {
    getMyJobs: vi.fn().mockResolvedValue({
      data: [
        {
          _id: 'job-1',
          position: 'Software Engineer',
          location: 'San Francisco',
          district: 'SF',
          salary: '$150k',
          status: 'Open',
          vacancies: 2,
          applications: [
            {
              _id: 'app-1',
              candidateName: 'John Doe',
              candidateEmail: 'john@example.com',
              applicationStatus: 'Applied',
            }
          ],
          createdAt: new Date().toISOString(),
        }
      ]
    }),
    toggleJobStatus: vi.fn().mockResolvedValue({
      data: { success: true, message: 'Status updated', status: 'Closed' }
    }),
    deleteJob: vi.fn().mockResolvedValue({
      data: { success: true }
    }),
    updateApplicationStatus: vi.fn().mockResolvedValue({
      data: { success: true }
    }),
  },
}));

describe('JobDashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard with stats and job listings', async () => {
    render(<JobDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/Software Engineer/i)[0]).toBeDefined();
      expect(screen.getByText(/1 Applicant/i)).toBeDefined();
      expect(screen.getByText(/2 Vacancies/i)).toBeDefined();
    }, { timeout: 5000 });
    
    // Check stats
    expect(screen.getByText(/Total Listings/i)).toBeDefined();
    expect(screen.getAllByText(/1/)[0]).toBeDefined(); // Total listings count
  });

  it('toggles job status when clicking the status button', async () => {
    render(<JobDashboard />);

    await waitFor(() => screen.getAllByText(/Software Engineer/i)[0], { timeout: 5000 });

    const toggleBtn = screen.getByTitle(/Close listing/i);
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(jobService.toggleJobStatus).toHaveBeenCalledWith('job-1');
    }, { timeout: 5000 });
  });

  it('expands job applications when clicking the Apps button', async () => {
    render(<JobDashboard />);

    await waitFor(() => screen.getAllByText(/Software Engineer/i)[0], { timeout: 5000 });

    const appsBtn = screen.getByText(/1 Apps/i);
    fireEvent.click(appsBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/John Doe/i)[0]).toBeDefined();
      expect(screen.getByText(/john@example.com/i)).toBeDefined();
    }, { timeout: 5000 });
  });

  it('updates applicant status via dropdown', async () => {
    render(<JobDashboard />);

    await waitFor(() => screen.getAllByText(/Software Engineer/i)[0], { timeout: 5000 });

    const appsBtn = screen.getByText(/1 Apps/i);
    fireEvent.click(appsBtn);

    await waitFor(() => screen.getAllByText(/John Doe/i)[0], { timeout: 5000 });

    const statusDropdown = screen.getByDisplayValue(/Applied/i);
    fireEvent.change(statusDropdown, { target: { value: 'Interview' } });

    await waitFor(() => {
      expect(jobService.updateApplicationStatus).toHaveBeenCalledWith('job-1', 'app-1', 'Interview');
    }, { timeout: 5000 });
  });

  it('deletes a job listing after confirmation', async () => {
    render(<JobDashboard />);

    await waitFor(() => screen.getAllByText(/Software Engineer/i)[0], { timeout: 5000 });

    const deleteBtn = screen.getByTitle(/Delete listing/i);
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith('Delete this job listing?');
    await waitFor(() => {
      expect(jobService.deleteJob).toHaveBeenCalledWith('job-1');
    }, { timeout: 5000 });
  });
});

