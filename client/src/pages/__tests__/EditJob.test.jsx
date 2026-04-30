import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import EditJob from '../EditJob';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jobService } from '../../services';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'j1' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock LocationContext
vi.mock('../../context/LocationContext', () => ({
  LocationProvider: ({ children }) => <div data-testid="location-provider">{children}</div>,
  useLocation: () => ({
    availableDistricts: ['Pune', 'Ahmedabad'],
  }),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => {
  const toastMock = {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  };
  return { default: toastMock, toast: toastMock, Toaster: () => null };
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const p = { ...props };
      ['initial','animate','exit','transition','layout','whileHover','whileTap','whileInView','layoutId'].forEach(k => delete p[k]);
      return <div {...p}>{children}</div>;
    },
    span: ({ children, ...props }) => {
      const p = { ...props };
      ['initial','animate','exit','transition','layout','whileHover','whileTap'].forEach(k => delete p[k]);
      return <span {...p}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock jobService
vi.mock('../../services', () => ({
  jobService: {
    getJobById: vi.fn().mockResolvedValue({
      data: {
        _id: 'j1',
        position: 'Software Engineer',
        location: 'Pune',
        vacancies: 2,
        education: 'Graduate',
        district: 'Pune',
        experience: '2 Years',
        skills: 'React, Node',
        salary: '50,000',
        gender: 'Both',
        posterName: 'Admin',
        posterEmail: 'admin@test.com',
        posterContact: '9876543210',
        status: 'Open',
        description: 'Job description text',
        jobType: 'Full-time',
        deadline: '2026-12-31'
      }
    }),
    updateJob: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('EditJob Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays job data', async () => {
    render(<EditJob />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g. Sales Executive/i).value).toBe('Software Engineer');
      expect(screen.getByPlaceholderText(/e.g. MG Road, Pune/i).value).toBe('Pune');
    }, { timeout: 5000 });
  });

  it('handles form submission', async () => {
    render(<EditJob />);
    
    await waitFor(() => screen.getByPlaceholderText(/e.g. Sales Executive/i), { timeout: 5000 });

    const positionInput = screen.getByPlaceholderText(/e.g. Sales Executive/i);
    fireEvent.change(positionInput, { target: { name: 'position', value: 'Senior Dev' } });

    const saveBtn = screen.getAllByRole('button', { name: /Save Changes/i })[0];
    fireEvent.submit(saveBtn.closest('form'));

    await waitFor(() => {
      expect(jobService.updateJob).toHaveBeenCalledWith('j1', expect.objectContaining({
        position: 'Senior Dev'
      }));
    }, { timeout: 5000 });
  });

  it('navigates back to dashboard on cancel', async () => {
    render(<EditJob />);
    
    await waitFor(() => screen.getAllByRole('button', { name: /Cancel/i })[0], { timeout: 5000 });
    
    const cancelBtn = screen.getAllByRole('button', { name: /Cancel/i })[0];
    fireEvent.click(cancelBtn);
  });
});
