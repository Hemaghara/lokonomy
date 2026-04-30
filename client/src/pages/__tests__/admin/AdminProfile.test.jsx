import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminProfile from '../../admin/AdminProfile';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    updateProfile: vi.fn().mockResolvedValue({
      data: {
        name: 'Updated Admin',
        email: 'updated@test.com',
        role: 'superadmin'
      }
    })
  }
}));

describe('AdminProfile Page', () => {
  const mockAdmin = {
    _id: 'a1',
    name: 'Main Admin',
    email: 'admin@test.com',
    role: 'superadmin'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('adminInfo', JSON.stringify(mockAdmin));
  });

  it('renders initial profile data from localStorage', async () => {
    render(<AdminProfile />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Main Admin')[0]).toBeDefined();
      expect(screen.getAllByText('superadmin')[0]).toBeDefined();
      expect(screen.getByDisplayValue('Main Admin')).toBeDefined();
      expect(screen.getByDisplayValue('admin@test.com')).toBeDefined();
    });
  });

  it('handles profile update', async () => {
    render(<AdminProfile />);
    
    await waitFor(() => screen.getByDisplayValue('Main Admin'));

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Admin', name: 'name' } });

    const updateBtn = screen.getAllByRole('button', { name: /Update Profile/i })[0];
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(adminService.updateProfile).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Updated Admin'
      }));
      expect(JSON.parse(localStorage.getItem('adminInfo')).name).toBe('Updated Admin');
    });
  });

  it('validates password requirements', async () => {
    render(<AdminProfile />);
    
    await waitFor(() => screen.getByDisplayValue('Main Admin'));

    const passInput = screen.getByPlaceholderText('Leave blank to keep current');
    const confirmInput = screen.getByPlaceholderText('Must match password');

    // Test mismatch
    fireEvent.change(passInput, { target: { value: 'Pass123!', name: 'password' } });
    fireEvent.change(confirmInput, { target: { value: 'Pass123', name: 'confirmPassword' } });
    
    fireEvent.click(screen.getAllByRole('button', { name: /Update Profile/i })[0]);
    // Toast would show error, but we check if updateProfile was NOT called
    expect(adminService.updateProfile).not.toHaveBeenCalled();
  });

  it('disables role selection for non-superadmin', async () => {
    localStorage.setItem('adminInfo', JSON.stringify({ ...mockAdmin, role: 'moderator' }));
    
    render(<AdminProfile />);
    
    await waitFor(() => screen.getByDisplayValue('Main Admin'));
    
    const roleSelect = screen.getAllByRole('combobox')[0];
    expect(roleSelect.disabled).toBe(true);
    expect(screen.getAllByText('* Only superadmins can modify roles')[0]).toBeDefined();
  });
});

