import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Login from '../Login';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services';
import toast from 'react-hot-toast';

// Mock services and external libraries
vi.mock('../../services', () => ({
  authService: {
    login: vi.fn(),
    verifyOtp: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => {
  const toastMock = {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn().mockReturnValue('loading-id'),
    dismiss: vi.fn(),
  };
  return {
    default: toastMock,
    toast: toastMock,
    Toaster: () => null,
  };
});

// Mock pushService
vi.mock('../../services/pushService', () => ({
  subscribeToPush: vi.fn().mockResolvedValue(undefined),
}));

// Mock Geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn().mockImplementation((success) =>
    success({
      coords: {
        latitude: 12.34,
        longitude: 56.78,
        accuracy: 10,
      },
    })
  ),
};
global.navigator.geolocation = mockGeolocation;

// Mock fetch for reverse geocoding
global.fetch = vi.fn().mockResolvedValue({
  json: vi.fn().mockResolvedValue({
    display_name: 'Test City, State, Country',
    address: { state_district: 'Test District', suburb: 'Test Taluka' },
  }),
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const filtered = { ...props };
      delete filtered.initial; delete filtered.animate; delete filtered.exit;
      delete filtered.transition; delete filtered.layout; delete filtered.whileHover;
      delete filtered.whileTap; delete filtered.whileInView;
      return <div {...filtered}>{children}</div>;
    },
    form: ({ children, ...props }) => {
      const filtered = { ...props };
      delete filtered.initial; delete filtered.animate; delete filtered.exit;
      delete filtered.transition; delete filtered.layout;
      return <form aria-label="login-form" {...filtered}>{children}</form>;
    },
    h1: ({ children, ...props }) => {
      const filtered = { ...props };
      delete filtered.initial; delete filtered.animate; delete filtered.exit;
      delete filtered.transition;
      return <h1 {...filtered}>{children}</h1>;
    },
    button: ({ children, ...props }) => {
      const filtered = { ...props };
      delete filtered.initial; delete filtered.animate; delete filtered.exit;
      delete filtered.transition; delete filtered.whileHover; delete filtered.whileTap;
      return <button {...filtered}>{children}</button>;
    },
    p: ({ children, ...props }) => {
      const filtered = { ...props };
      delete filtered.initial; delete filtered.animate; delete filtered.exit;
      delete filtered.transition;
      return <p {...filtered}>{children}</p>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import { LocationProvider } from '../../context/LocationContext';

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with email and password fields', () => {
    render(<Login />);

    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/••••••••••••/i)).toBeDefined();
    expect(screen.getAllByRole('button', { name: /Authorize/i })[0]).toBeDefined();
  });

  it('enables login button after GPS authorization', async () => {
    render(<Login />);

    const authorizeBtn = screen.getAllByRole('button', { name: /Authorize/i })[0];
    fireEvent.click(authorizeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Access Verified/i)).toBeDefined();
    });

    const loginBtn = screen.getAllByRole('button', { name: /Sign In Now/i })[0];
    expect(loginBtn.hasAttribute('disabled')).toBe(false);
  });

  it('shows error toast if fields are empty and login is clicked', async () => {
    render(<Login />);

    // Authorize GPS first
    fireEvent.click(screen.getAllByRole('button', { name: /Authorize/i })[0]);
    
    await waitFor(() => screen.getByText(/Access Verified/i));

    // Submit the form using aria-label
    const form = screen.getByRole('form', { name: /login-form/i });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please fill all fields');
    });
  });
});
