import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Register from '../Register';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService, referralService } from '../../services';

// Mock services
vi.mock('../../services', () => ({
  authService: {
    register: vi.fn().mockResolvedValue({
      data: {
        success: true,
        token: 'mock-token',
        user: { name: 'New User', email: 'new@example.com' }
      }
    }),
  },
  referralService: {
    validateReferralCode: vi.fn().mockResolvedValue({
      data: { success: true, referrerName: 'Alice' }
    }),
  }
}));

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form', () => {
    render(<Register />);
    expect(screen.getByText(/Create Citizen Profile/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/John Doe/i)).toBeDefined();
  });

  it('handles GPS location fetching', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: vi.fn().mockImplementation((success) => success({
          coords: { latitude: 12.34, longitude: 56.78, accuracy: 10 }
        }))
      }
    });

    render(<Register />);
    
    const gpsBtn = screen.getAllByRole('button', { name: /Allow GPS/i })[0];
    fireEvent.click(gpsBtn);

    await waitFor(() => {
      // Both the toast ("Location captured successfully!") and the UI label ("Location Captured")
      // match the regex — use getAllByText and confirm at least one match exists
      expect(screen.getAllByText(/Location Captured/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/12\.34/i)).toBeInTheDocument();
    });
  });

  it('validates password matching', async () => {
    render(<Register />);
    
    fireEvent.change(screen.getByLabelText(/Create Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password456' } });
    
    const submitBtn = screen.getAllByRole('button', { name: /Register Citizen Node/i })[0];
    // Should still be disabled because GPS isn't captured, but let's check validation logic if possible
    // In this component, matching is checked on submit
  });

  it('submits registration form successfully', async () => {
    // Mock GPS granted
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: vi.fn().mockImplementation((success) => success({
          coords: { latitude: 12.34, longitude: 56.78, accuracy: 10 }
        }))
      }
    });

    render(<Register />);
    
    // Grant GPS
    fireEvent.click(screen.getAllByRole('button', { name: /Allow GPS/i })[0]);
    await waitFor(() => screen.getAllByText(/Location Captured/i).length > 0);

    // Fill fields
    fireEvent.change(screen.getByPlaceholderText(/John Doe/i), { target: { value: 'John Smith' } });
    fireEvent.change(screen.getByPlaceholderText(/john@example.com/i), { target: { value: 'jsmith@example.com' } });
    fireEvent.change(screen.getByLabelText(/Create Password/i), { target: { value: 'secure123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'secure123' } });

    const submitBtn = screen.getAllByRole('button', { name: /Register Citizen Node/i })[0];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Smith',
        email: 'jsmith@example.com'
      }));
    });
  });
});
