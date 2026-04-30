import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import PostJob from '../PostJob';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jobService } from '../../services';

vi.mock('../../services', () => ({
  jobService: { createJob: vi.fn().mockResolvedValue({ data: { success: true } }) },
}));

vi.mock('../../context/LocationContext', () => ({
  LocationProvider: ({ children }) => <div data-testid="location-provider">{children}</div>,
  useLocation: () => ({ availableDistricts: ['Pune', 'Ahmedabad'] }),
}));

vi.mock('../../hooks/usePlanLimits', () => ({
  usePlanLimits: () => ({ limits: { jobsPost: 10 } }),
}));

vi.mock('react-hot-toast', () => {
  const t = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() });
  return { default: t, toast: t, Toaster: () => null };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => { const f={...p};['initial','animate','exit','transition','layout','whileHover','whileTap','whileInView','layoutId'].forEach(k=>delete f[k]); return <div {...f}>{children}</div>; },
    span: ({ children, ...p }) => { const f={...p};['initial','animate','exit','transition','layout','whileHover','whileTap'].forEach(k=>delete f[k]); return <span {...f}>{children}</span>; },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('PostJob Page', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the job posting form', () => {
    render(<PostJob />);
    expect(screen.getByText(/Post a Job Listing/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/e.g. Sales Executive/i)).toBeDefined();
  });

  it('submits the form successfully', async () => {
    render(<PostJob />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Sales Executive/i), { target: { value: 'Software Engineer' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. MG Road, Pune/i), { target: { value: 'Ahmedabad' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. 3/i), { target: { value: '2' } });
    fireEvent.click(screen.getByText(/Select District/i));
    fireEvent.click(screen.getByText('Ahmedabad'));
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 0.2 Years/i), { target: { value: '3 Years' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 15.?000.+20.?000/i), { target: { value: '50000' } });
    fireEvent.change(screen.getByPlaceholderText(/Detailed description/i), { target: { value: 'Job description' } });
    fireEvent.change(screen.getByPlaceholderText(/Full Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/email@company.com/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Mobile Number/i), { target: { value: '1234567890' } });
    const submitBtn = screen.getAllByRole('button', { name: /Publish Job Listing/i })[0];
    fireEvent.submit(submitBtn.closest('form'));
    await waitFor(() => {
      expect(jobService.createJob).toHaveBeenCalledWith(expect.objectContaining({
        position: 'Software Engineer', location: 'Ahmedabad', district: 'Ahmedabad'
      }));
    }, { timeout: 10000 });
  });

  it('handles plan limit errors', async () => {
    const toast = (await import('react-hot-toast')).toast;
    jobService.createJob.mockRejectedValueOnce({
      response: { data: { code: 'LIMIT_REACHED', message: 'You have reached your monthly job posting limit.' } }
    });
    render(<PostJob />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Sales Executive/i), { target: { value: 'Dev' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. MG Road, Pune/i), { target: { value: 'Loc' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. 3/i), { target: { value: '1' } });
    fireEvent.click(screen.getByText(/Select District/i));
    fireEvent.click(screen.getByText('Pune'));
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 0.?2 Years/i), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 15.?000.+20.?000/i), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText(/Detailed description/i), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByPlaceholderText(/Full Name/i), { target: { value: 'N' } });
    fireEvent.change(screen.getByPlaceholderText(/email@company.com/i), { target: { value: 'e@e.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Mobile Number/i), { target: { value: '1' } });
    const submitBtn = screen.getAllByRole('button', { name: /Publish Job Listing/i })[0];
    fireEvent.submit(submitBtn.closest('form'));
    await waitFor(() => { expect(toast).toHaveBeenCalled(); }, { timeout: 10000 });
  });
});
