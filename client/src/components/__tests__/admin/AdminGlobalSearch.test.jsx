import { render, screen, fireEvent, waitFor, act } from '../../../utils/test-utils';
import AdminGlobalSearch from '../../admin/AdminGlobalSearch';
import { adminService } from '../../../services';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../services', () => ({
  adminService: {
    globalSearch: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminGlobalSearch Component', () => {
  const mockResults = {
    data: {
      users: [{ _id: 'u1', name: 'John Doe', email: 'john@example.com' }],
      businesses: [{ _id: 'b1', businessName: 'Tech Shop', mainCategory: 'Retail', district: 'Downtown' }],
      jobs: [{ _id: 'j1', position: 'Developer', posterName: 'Tech Corp', district: 'Uptown' }],
      products: [{ _id: 'p1', productName: 'Laptop', price: 1000, mainCategory: 'Electronics' }],
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(<AdminGlobalSearch />);
    expect(screen.getByPlaceholderText(/Search users, businesses, jobs.../i)).toBeInTheDocument();
  });

  it('triggers search after typing 2 or more characters (debounce)', async () => {
    adminService.globalSearch.mockResolvedValueOnce(mockResults);
    render(<AdminGlobalSearch />);
    
    const input = screen.getByPlaceholderText(/Search users, businesses, jobs.../i);
    fireEvent.change(input, { target: { value: 'test' } });

    // Fast-forward time
    await new Promise(r => setTimeout(r, 600));

    await waitFor(() => {
      expect(adminService.globalSearch).toHaveBeenCalledWith('test');
    });

    await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Tech Shop')).toBeInTheDocument();
    });
  });

  it('shows loading state while searching', async () => {
    adminService.globalSearch.mockReturnValue(new Promise(resolve => setTimeout(() => resolve(mockResults), 1000)));
    render(<AdminGlobalSearch />);
    
    const input = screen.getByPlaceholderText(/Search users, businesses, jobs.../i);
    fireEvent.change(input, { target: { value: 'test' } });

    await new Promise(r => setTimeout(r, 500));

    await waitFor(() => {
      expect(screen.getByText(/Searching.../i)).toBeInTheDocument();
    });
  });

  it('shows "No results found" when search returns empty', async () => {
    adminService.globalSearch.mockResolvedValueOnce({
      data: { users: [], businesses: [], jobs: [], products: [] }
    });
    render(<AdminGlobalSearch />);
    
    const input = screen.getByPlaceholderText(/Search users, businesses, jobs.../i);
    fireEvent.change(input, { target: { value: 'unknown' } });

    await new Promise(r => setTimeout(r, 600));

    await waitFor(() => {
      expect(screen.getByText(/No results found/i)).toBeInTheDocument();
    });
  });

  it('navigates and closes search when a result is clicked', async () => {
    adminService.globalSearch.mockResolvedValueOnce(mockResults);
    render(<AdminGlobalSearch />);
    
    const input = screen.getByPlaceholderText(/Search users, businesses, jobs.../i);
    fireEvent.change(input, { target: { value: 'test' } });

    await new Promise(r => setTimeout(r, 600));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/users?search=john@example.com');
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('clears query and closes results when clear button is clicked', async () => {
    adminService.globalSearch.mockResolvedValueOnce(mockResults);
    render(<AdminGlobalSearch />);
    
    const input = screen.getByPlaceholderText(/Search users, businesses, jobs.../i);
    fireEvent.change(input, { target: { value: 'test' } });

    await new Promise(r => setTimeout(r, 600));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // FiX button is revealed when query exists
    const clearButton = screen.getByLabelText('Clear search'); 
    fireEvent.click(clearButton);

    expect(input.value).toBe('');
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });
});
