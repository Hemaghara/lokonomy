import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import WishlistButton from '../WishlistButton';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wishlistService } from '../../services';
import { useUser } from '../../context/UserContext';
import { toast } from 'react-hot-toast';

vi.mock('../../services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    wishlistService: {
      checkWishlistStatus: vi.fn(),
      toggleWishlist: vi.fn()
    }
  };
});

vi.mock('../../context/UserContext', () => ({
  useUser: vi.fn(),
  UserProvider: ({ children }) => <div data-testid="user-provider">{children}</div>
}));

vi.mock('react-hot-toast', async (importOriginal) => {
  const actual = await importOriginal();
  const mockToast = vi.fn();
  mockToast.success = vi.fn();
  mockToast.error = vi.fn();
  return {
    ...actual,
    default: mockToast,
    toast: mockToast,
  };
});

describe('WishlistButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error if not logged in and clicked', async () => {
    useUser.mockReturnValue({ user: null });
    render(<WishlistButton type="product" id="1" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(toast.error).toHaveBeenCalledWith('Please login to save items');
  });

  it('checks status on mount if logged in', async () => {
    useUser.mockReturnValue({ user: { id: 'user1' } });
    wishlistService.checkWishlistStatus.mockResolvedValueOnce({ isSaved: true });
    
    render(<WishlistButton type="product" id="1" />);
    
    await waitFor(() => {
      expect(wishlistService.checkWishlistStatus).toHaveBeenCalledWith('product', '1');
    });
  });

  it('toggles wishlist status on click', async () => {
    useUser.mockReturnValue({ user: { id: 'user1' } });
    wishlistService.checkWishlistStatus.mockResolvedValueOnce({ isSaved: false });
    wishlistService.toggleWishlist.mockResolvedValueOnce({ isSaved: true, message: 'Added to wishlist' });
    
    const onToggle = vi.fn();
    render(<WishlistButton type="product" id="1" onToggle={onToggle} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(wishlistService.toggleWishlist).toHaveBeenCalledWith('product', '1');
      expect(toast.success).toHaveBeenCalledWith('Added to wishlist');
      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });
});

