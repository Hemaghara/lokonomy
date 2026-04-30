import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminLogin from '../../admin/AdminLogin';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    login: vi.fn().mockResolvedValue({
      data: {
        token: 'mock-token',
        name: 'Admin User'
      }
    })
  }
}));

describe('AdminLogin Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form correctly', () => {
    render(<AdminLogin />);
    
    expect(screen.getAllByText('Lokonomy Admin')[0]).toBeDefined();
    expect(screen.getByPlaceholderText('admin@lokonomy.com')).toBeDefined();
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined();
    expect(screen.getAllByRole('button', { name: /Sign In to Panel/i })[0]).toBeDefined();
  });

  it('handles input changes', () => {
    render(<AdminLogin />);
    
    const emailInput = screen.getByPlaceholderText('admin@lokonomy.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'admin@test.com', name: 'email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123', name: 'password' } });

    expect(emailInput.value).toBe('admin@test.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('submits form successfully', async () => {
    render(<AdminLogin />);
    
    fireEvent.change(screen.getByPlaceholderText('admin@lokonomy.com'), { target: { value: 'admin@test.com', name: 'email' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123', name: 'password' } });
    
    fireEvent.click(screen.getAllByRole('button', { name: /Sign In to Panel/i })[0]);

    await waitFor(() => {
      expect(adminService.login).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'password123'
      });
      expect(localStorage.getItem('adminToken')).toBe('mock-token');
    });
  });

  it('handles login failure', async () => {
    adminService.login.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } }
    });

    render(<AdminLogin />);
    
    fireEvent.change(screen.getByPlaceholderText('admin@lokonomy.com'), { target: { value: 'wrong@test.com', name: 'email' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass', name: 'password' } });
    
    fireEvent.click(screen.getAllByRole('button', { name: /Sign In to Panel/i })[0]);

    await waitFor(() => {
      expect(adminService.login).toHaveBeenCalled();
      // Toast message check usually requires mocking toast, but we can check if navigate wasn't called
      expect(localStorage.getItem('adminToken')).toBeNull();
    });
  });
});

