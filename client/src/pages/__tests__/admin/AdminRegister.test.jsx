import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminRegister from '../../admin/AdminRegister';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    register: vi.fn().mockResolvedValue({
      data: {
        token: 'mock-token',
        name: 'New Admin',
        role: 'admin'
      }
    })
  }
}));

describe('AdminRegister Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders registration form correctly', () => {
    render(<AdminRegister />);
    
    expect(screen.getAllByText('Admin Signup')[0]).toBeDefined();
    expect(screen.getByPlaceholderText('John Doe')).toBeDefined();
    expect(screen.getByPlaceholderText('admin@lokonomy.com')).toBeDefined();
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined();
    expect(screen.getAllByRole('button', { name: /Complete Registration/i })[0]).toBeDefined();
  });

  it('handles input changes and role selection', () => {
    render(<AdminRegister />);
    
    const nameInput = screen.getByPlaceholderText('John Doe');
    const roleSelect = screen.getAllByRole('combobox')[0];

    fireEvent.change(nameInput, { target: { value: 'Jane Admin', name: 'name' } });
    fireEvent.change(roleSelect, { target: { value: 'superadmin', name: 'role' } });

    expect(nameInput.value).toBe('Jane Admin');
    expect(roleSelect.value).toBe('superadmin');
  });

  it('submits form successfully', async () => {
    render(<AdminRegister />);
    
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'New Admin', name: 'name' } });
    fireEvent.change(screen.getByPlaceholderText('admin@lokonomy.com'), { target: { value: 'new@test.com', name: 'email' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123', name: 'password' } });
    
    fireEvent.click(screen.getAllByRole('button', { name: /Complete Registration/i })[0]);

    await waitFor(() => {
      expect(adminService.register).toHaveBeenCalledWith({
        name: 'New Admin',
        email: 'new@test.com',
        password: 'password123',
        role: 'admin'
      });
      expect(localStorage.getItem('adminToken')).toBe('mock-token');
    });
  });

  it('validates email format', async () => {
    render(<AdminRegister />);
    
    fireEvent.change(screen.getByPlaceholderText('admin@lokonomy.com'), { target: { value: 'invalid-email', name: 'email' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Complete Registration/i })[0]);

    expect(adminService.register).not.toHaveBeenCalled();
  });

  it('handles registration failure', async () => {
    adminService.register.mockRejectedValueOnce({
      response: { data: { message: 'Email already exists' } }
    });

    render(<AdminRegister />);
    
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'New Admin', name: 'name' } });
    fireEvent.change(screen.getByPlaceholderText('admin@lokonomy.com'), { target: { value: 'exists@test.com', name: 'email' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123', name: 'password' } });
    
    fireEvent.click(screen.getAllByRole('button', { name: /Complete Registration/i })[0]);

    await waitFor(() => {
      expect(adminService.register).toHaveBeenCalled();
      expect(localStorage.getItem('adminToken')).toBeNull();
    });
  });
});

