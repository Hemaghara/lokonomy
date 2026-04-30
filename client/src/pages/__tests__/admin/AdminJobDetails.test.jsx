import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminJobDetails from '../../admin/AdminJobDetails';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock AdminLayout
vi.mock('../../../layouts/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'j1' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getJobDetails: vi.fn().mockResolvedValue({
      data: {
        _id: 'j1',
        position: 'Software Engineer',
        jobType: 'Full-time',
        location: 'Remote',
        district: 'Mehsana',
        salary: '₹50,000 - ₹80,000',
        vacancies: 2,
        education: 'Bachelor',
        skills: 'React, Node.js',
        experience: '2+ years',
        gender: 'Any',
        status: 'Open',
        description: 'Join our team as a software engineer.',
        isFlagged: false,
        isSuspended: false,
        views: 150,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        posterId: {
          _id: 'u1',
          name: 'Tech Corp',
          email: 'hr@techcorp.com',
          phoneNumber: '1234567890',
          district: 'Mehsana',
          subscription: { plan: 'gold', status: 'active' }
        },
        applications: [
          {
            _id: 'app1',
            candidateName: 'John Candidate',
            candidateContact: '9998887776',
            candidateEducation: 'Master in CS',
            applicationStatus: 'Under Review',
            appliedAt: new Date().toISOString()
          }
        ]
      }
    }),
    getJobPosterUsage: vi.fn().mockResolvedValue({
      data: {
        user: { plan: 'Gold', subscriptionStatus: 'Active' },
        usage: { jobsPosted: 5, jobsLimit: 10, percentUsed: 50, remaining: 5 }
      }
    }),
    toggleBanJob: vi.fn().mockResolvedValue({ data: { message: 'Job banned' } }),
    toggleSuspendJob: vi.fn().mockResolvedValue({ data: { message: 'Job suspended' } }),
  }
}));

describe('AdminJobDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders job details and statistics', async () => {
    render(<AdminJobDetails />);

    await waitFor(() => {
      expect(screen.getAllByText(/Software Engineer/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/₹50,000 - ₹80,000/i).length).toBeGreaterThan(0);
      // vacancies is rendered as a StatTile value
      expect(screen.getAllByText('2')[0]).toBeInTheDocument();
      // views
      expect(screen.getAllByText('150').length).toBeGreaterThan(0);
      // applications count shown as "1 received"
      expect(screen.getAllByText('1 received')[0]).toBeInTheDocument();
    });
  });

  it('renders poster profile', async () => {
    render(<AdminJobDetails />);

    await waitFor(() => {
      expect(screen.getAllByText(/Tech Corp/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/hr@techcorp.com/i).length).toBeGreaterThan(0);
    });
  });

  it('renders usage quota after poster data loads', async () => {
    render(<AdminJobDetails />);

    await waitFor(() => {
      // The usage section shows "5 / 10" and "50% quota used"
      expect(screen.getByText(/50% quota used/i)).toBeInTheDocument();
    });
  });

  it('renders applications list', async () => {
    render(<AdminJobDetails />);

    await waitFor(() => {
      expect(screen.getAllByText(/John Candidate/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Master in CS/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Under Review/i).length).toBeGreaterThan(0);
    });
  });

  it('handles moderation ban action', async () => {
    render(<AdminJobDetails />);

    await waitFor(() => screen.getAllByText(/Software Engineer/i));

    const banBtn = screen.getAllByRole('button', { name: /Ban/i })[0];
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(adminService.toggleBanJob).toHaveBeenCalledWith('j1');
    });
  });

  it('handles moderation suspend action', async () => {
    render(<AdminJobDetails />);

    await waitFor(() => screen.getAllByText(/Software Engineer/i));

    const suspendBtn = screen.getAllByRole('button', { name: /Suspend/i })[0];
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(adminService.toggleSuspendJob).toHaveBeenCalledWith('j1');
    });
  });

  it('shows not found screen on error', async () => {
    adminService.getJobDetails.mockRejectedValueOnce(new Error('Not Found'));

    render(<AdminJobDetails />);

    await waitFor(() => {
      expect(screen.getByText(/Not Found/i)).toBeInTheDocument();
    });
  });
});
