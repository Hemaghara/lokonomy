import { render, screen, waitFor } from '../../utils/test-utils';
import ProtectedRouteAdmin from '../ProtectedRouteAdmin';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../services';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../services', () => ({
  adminService: {
    verify: vi.fn(),
    reauth: vi.fn()
  }
}));

describe('ProtectedRouteAdmin Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderWithRouter = (ui, { route = '/' } = {}) => {
    return render(
      <Routes>
        <Route path="/admin/login" element={<div>Admin Login</div>} />
        <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
        {ui}
      </Routes>,
      { initialEntries: [route] }
    );
  };

  it('redirects to login if no token', async () => {
    renderWithRouter(<Route path="/" element={<ProtectedRouteAdmin />} />);
    
    await waitFor(() => {
      expect(screen.getByText('Admin Login')).toBeInTheDocument();
    });
  });

  it('renders Outlet if verified', async () => {
    localStorage.setItem('adminToken', 'header.eyJleHAiOiA5OTk5OTk5OTk5fQ==.signature');
    localStorage.setItem('adminInfo', JSON.stringify({ role: 'superadmin' }));
    adminService.verify.mockResolvedValueOnce({ data: { success: true } });

    renderWithRouter(
      <Route path="/" element={<ProtectedRouteAdmin />}>
        <Route index element={<div>Protected Content</div>} />
      </Route>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('redirects to dashboard if role mismatch', async () => {
    localStorage.setItem('adminToken', 'header.eyJleHAiOiA5OTk5OTk5OTk5fQ==.signature');
    localStorage.setItem('adminInfo', JSON.stringify({ role: 'admin' }));
    adminService.verify.mockResolvedValueOnce({ data: { success: true } });

    renderWithRouter(
      <Route path="/" element={<ProtectedRouteAdmin requiredRole="superadmin" />}>
        <Route index element={<div>Protected Content</div>} />
      </Route>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });
});
