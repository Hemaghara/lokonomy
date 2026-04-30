import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Profile from '../Profile';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService, businessService, jobService, referralService } from '../../services';

// Mock services
vi.mock('../../services', () => ({
  authService: {
    updateProfile: vi.fn().mockResolvedValue({ data: { success: true, user: { name: 'New Name' } } }),
  },
  businessService: {
    getMyBusinesses: vi.fn().mockResolvedValue({ data: [] }),
    deleteBusiness: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
  jobService: {
    getAppliedJobs: vi.fn().mockResolvedValue({ data: [] }),

  },
  referralService: {
    getMyReferralCode: vi.fn().mockResolvedValue({ data: { referralCode: 'REF123' } }),
  },
  subscriptionService: {
    getMySubscription: vi.fn().mockResolvedValue({ data: { plan: 'Free' } }),
  }
}));

// Mock pushService
vi.mock('../../services/pushService', () => ({
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
  toggleNotifications: vi.fn(),
  toggleAppointmentReminders: vi.fn(),
}));

// Mock hooks
vi.mock('../../hooks/usePlanLimits', () => ({
  usePlanLimits: () => ({
    limits: { businesses: 2, products: 10, jobs: 5 },
  }),
}));

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user profile information', async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText(/Personal Information/i)).toBeDefined();
      expect(screen.getByDisplayValue(/Test User/i)).toBeDefined();
    }, { timeout: 5000 });
  });

  it('updates profile name successfully', async () => {
    render(<Profile />);
    
    await waitFor(() => screen.getByPlaceholderText(/Your full name/i), { timeout: 5000 });

    const nameInput = screen.getByPlaceholderText(/Your full name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    
    const saveBtn = screen.getByText(/Save Changes/i);
    fireEvent.submit(saveBtn.closest('form'));
    
    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
    }, { timeout: 5000 });
  });

  it('switches to Businesses tab and shows empty state', async () => {
    render(<Profile />);
    
    await waitFor(() => screen.getAllByRole('button', { name: /Businesses/i })[0], { timeout: 5000 });

    const bizTab = screen.getAllByRole('button', { name: /Businesses/i })[0];
    fireEvent.click(bizTab);
    
    await waitFor(() => {
      expect(screen.getByText(/No businesses added yet/i)).toBeDefined();
    }, { timeout: 5000 });
  });

  it('switches to Location tab and handles GPS refresh', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: vi.fn().mockImplementation((success) => success({
          coords: { latitude: 10, longitude: 20 }
        }))
      }
    });

    render(<Profile />);
    
    await waitFor(() => screen.getAllByRole('button', { name: /Location/i })[0], { timeout: 5000 });

    const locTab = screen.getAllByRole('button', { name: /Location/i })[0];
    fireEvent.click(locTab);
    
    await waitFor(() => {
      expect(screen.getByText(/GPS Location/i)).toBeDefined();
    }, { timeout: 5000 });

    const refreshBtn = screen.getByText(/Update to Current Location/i);
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    }, { timeout: 5000 });
  });
});

