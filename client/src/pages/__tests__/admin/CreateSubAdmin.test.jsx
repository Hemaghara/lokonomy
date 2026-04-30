import React from 'react';

vi.mock('../../../layouts/AdminLayout', () => ({ __esModule: true, default: ({ children }) => <>{children}</> }));
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import CreateSubAdmin from '../../admin/CreateSubAdmin';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';
import { useParams } from 'react-router-dom';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getSubAdminById: vi.fn().mockResolvedValue({
      data: {
        data: {
          name: 'Jane Moderator',
          email: 'jane@test.com',
          role: 'Content Moderator',
          permissions: ['Content', 'Reports'],
          status: 'Active'
        }
      }
    }),
    createSubAdmin: vi.fn().mockResolvedValue({ data: { success: true } }),
    updateSubAdmin: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

// Mock react-router-dom at top level
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: () => vi.fn(),
  };
});

describe('CreateSubAdmin Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useParams.mockReturnValue({});
  });

  it('renders creation form by default', () => {
    render(<CreateSubAdmin />);
    
    expect(screen.getByText(/Create Sub-/i)).toBeDefined();
    expect(screen.getByPlaceholderText('Full Name')).toBeDefined();
    expect(screen.getByPlaceholderText('Email Address')).toBeDefined();
    expect(screen.getByPlaceholderText('Account Password')).toBeDefined();
    expect(screen.getByText(/Deploy Admin/i)).toBeDefined();
  });

  it('handles input changes and role selection presets', async () => {
    render(<CreateSubAdmin />);
    
    const nameInput = screen.getByPlaceholderText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'New Agent' } });
    expect(nameInput.value).toBe('New Agent');

    const supportRoleBtn = screen.getAllByRole('button', { name: /Support Agent/i })[0];
    fireEvent.click(supportRoleBtn);

    // Support Agent preset: ["Support System", "User Management"]
    await waitFor(async () => {
      const supportSystemPerm = await screen.findByText('Support System');
      const parentBtn = supportSystemPerm.closest('button');
      expect(parentBtn.className).toContain('bg-indigo-600/10');
    });
  });

  it('toggles permissions manually', async () => {
    render(<CreateSubAdmin />);
    
    const financePerm = await screen.findByText('Finance');
    const financePermBtn = financePerm.closest('button');
    
    fireEvent.click(financePermBtn);

    await waitFor(() => {
      expect(financePermBtn.className).toContain('bg-indigo-600/10');
    });
  });

  it('submits creation form successfully', async () => {
    render(<CreateSubAdmin />);
    
    fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Test Admin' } });
    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Account Password'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getAllByRole('button', { name: /Deploy Admin/i })[0]);

    await waitFor(() => {
      expect(adminService.createSubAdmin).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Admin',
        email: 'test@test.com'
      }));
    });
  });

  it('renders edit mode when ID is provided', async () => {
    useParams.mockReturnValue({ id: 'sub1' });

    render(<CreateSubAdmin />);
    
    await waitFor(() => {
      expect(adminService.getSubAdminById).toHaveBeenCalledWith('sub1');
      expect(screen.getByDisplayValue('Jane Moderator')).toBeDefined();
      expect(screen.queryByPlaceholderText('Account Password')).toBeNull();
      expect(screen.getByText(/Save Account/i)).toBeDefined();
    });
  });
});



