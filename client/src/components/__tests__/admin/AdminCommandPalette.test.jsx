import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminCommandPalette from '../../admin/AdminCommandPalette';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

vi.mock('../../../services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    adminService: {
      globalSearch: vi.fn()
    }
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('AdminCommandPalette Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<AdminCommandPalette open={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Search users, pages/)).toBeInTheDocument();
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AdminCommandPalette open={false} onClose={vi.fn()} />);
    expect(screen.queryByPlaceholderText(/Search users, pages/)).not.toBeInTheDocument();
  });

  it('filters static navigation commands', async () => {
    render(<AdminCommandPalette open={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Search users, pages/);
    
    fireEvent.change(input, { target: { value: 'Users' } });
    
    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Overview')).not.toBeInTheDocument();
    });
  });

  it('calls adminService.globalSearch on valid input', async () => {
    adminService.globalSearch.mockResolvedValueOnce({
      data: { users: [{ _id: '1', name: 'User 1', email: 'user@test.com' }], businesses: [], jobs: [], products: [] }
    });

    render(<AdminCommandPalette open={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Search users, pages/);
    
    fireEvent.change(input, { target: { value: 'User' } });
    
    await waitFor(() => {
      expect(adminService.globalSearch).toHaveBeenCalledWith('User');
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('user@test.com')).toBeInTheDocument();
    });
  });
});
