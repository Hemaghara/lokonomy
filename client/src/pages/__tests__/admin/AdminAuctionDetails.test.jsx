import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminAuctionDetails from '../../admin/AdminAuctionDetails';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';
import { toast } from 'react-hot-toast';

// Mock AdminLayout to simplify
vi.mock('../../../layouts/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>
}));

const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'a1' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => <div data-testid="toaster" />
}));

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getMarketProductDetails: vi.fn(),
    toggleBanProduct: vi.fn(),
    toggleSuspendProduct: vi.fn(),
  }
}));

describe('AdminAuctionDetails Page', () => {
  const mockAuction = {
    _id: 'a1',
    productName: 'Vintage Watch',
    description: 'Rare collectible watch',
    mainCategory: 'Collectibles',
    subCategory: 'Watches',
    startingPrice: 5000,
    currentHighestBid: 7500,
    auctionEnd: new Date(Date.now() + 86400000).toISOString(),
    productImages: ['watch.png'],
    isFlagged: false,
    isSuspended: false,
    bids: [
      { userName: 'Alice', amount: 7500, timestamp: new Date().toISOString() },
      { userName: 'Bob', amount: 6000, timestamp: new Date(Date.now() - 3600000).toISOString() }
    ],
    sellerId: { _id: 'u1', name: 'Joe Seller' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getMarketProductDetails.mockResolvedValue({ data: mockAuction });
    adminService.toggleBanProduct.mockResolvedValue({ data: { message: 'Product banned' } });
    adminService.toggleSuspendProduct.mockResolvedValue({ data: { message: 'Product suspended' } });
  });

  it('renders loading state initially', () => {
    render(<AdminAuctionDetails />);
    expect(screen.getByText(/Loading Auction Details/i)).toBeInTheDocument();
  });

  it('renders auction details and bidding history correctly', async () => {
    render(<AdminAuctionDetails />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/Vintage Watch/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/7500/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Alice/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Bob/i).length).toBeGreaterThan(0);
    });
  });

  it('handles banning an auction', async () => {
    render(<AdminAuctionDetails />);
    
    await waitFor(() => screen.getAllByText(/Vintage Watch/i));

    const banBtn = screen.getByRole('button', { name: /Ban/i });
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(adminService.toggleBanProduct).toHaveBeenCalledWith('a1');
      expect(toast.success).toHaveBeenCalledWith('Product banned');
    });
  });

  it('handles suspending an auction', async () => {
    render(<AdminAuctionDetails />);
    
    await waitFor(() => screen.getAllByText(/Vintage Watch/i));

    const suspendBtn = screen.getByRole('button', { name: /Suspend/i });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(adminService.toggleSuspendProduct).toHaveBeenCalledWith('a1');
      expect(toast.success).toHaveBeenCalledWith('Product suspended');
    });
  });

  it('handles unbanning an auction when isFlagged is true', async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: { ...mockAuction, isFlagged: true }
    });
    adminService.toggleBanProduct.mockResolvedValueOnce({ data: { message: 'Product unbanned' } });

    render(<AdminAuctionDetails />);
    
    await waitFor(() => screen.getAllByText(/Vintage Watch/i));

    const unbanBtn = screen.getByRole('button', { name: /Unban/i });
    fireEvent.click(unbanBtn);

    await waitFor(() => {
      expect(adminService.toggleBanProduct).toHaveBeenCalledWith('a1');
      expect(toast.success).toHaveBeenCalledWith('Product unbanned');
    });
  });

  it('handles activating an auction when isSuspended is true', async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: { ...mockAuction, isSuspended: true }
    });
    adminService.toggleSuspendProduct.mockResolvedValueOnce({ data: { message: 'Product activated' } });

    render(<AdminAuctionDetails />);
    
    await waitFor(() => screen.getAllByText(/Vintage Watch/i));

    const activateBtn = screen.getByRole('button', { name: /Activate/i });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(adminService.toggleSuspendProduct).toHaveBeenCalledWith('a1');
      expect(toast.success).toHaveBeenCalledWith('Product activated');
    });
  });

  it('shows error state when auction not found', async () => {
    adminService.getMarketProductDetails.mockRejectedValueOnce(new Error('Not Found'));
    
    render(<AdminAuctionDetails />);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch auction details');
      expect(screen.getByText(/Auction Not Found/i)).toBeInTheDocument();
    });
  });

  it('shows error toast when toggle ban fails', async () => {
    adminService.toggleBanProduct.mockRejectedValueOnce(new Error('Failed'));
    
    render(<AdminAuctionDetails />);
    await waitFor(() => screen.getAllByText(/Vintage Watch/i));

    const banBtn = screen.getByRole('button', { name: /Ban/i });
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Action failed');
    });
  });

  it('shows error toast when toggle suspend fails', async () => {
    adminService.toggleSuspendProduct.mockRejectedValueOnce(new Error('Failed'));
    
    render(<AdminAuctionDetails />);
    await waitFor(() => screen.getAllByText(/Vintage Watch/i));

    const suspendBtn = screen.getByRole('button', { name: /Suspend/i });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Action failed');
    });
  });

  it('navigates to marketplace from not found state', async () => {
    adminService.getMarketProductDetails.mockRejectedValueOnce(new Error('Not Found'));
    render(<AdminAuctionDetails />);
    
    await waitFor(() => screen.getByText(/Auction Not Found/i));
    
    fireEvent.click(screen.getByText(/Back to Marketplace/i));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/marketplace');
  });

  it('navigates back when back button is clicked', async () => {
    render(<AdminAuctionDetails />);
    await waitFor(() => screen.getAllByText(/Vintage Watch/i));
    
    // Select the button with the FiArrowLeft icon
    const backBtn = screen.getByRole('button', { name: '' });
    // Note: If multiple empty buttons exist, we might need a test-id, but we'll simulate click on the first match
    const buttons = screen.getAllByRole('button');
    // The back button is the first button in the header
    fireEvent.click(buttons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to seller profile when View Seller Profile is clicked', async () => {
    render(<AdminAuctionDetails />);
    await waitFor(() => screen.getAllByText(/Vintage Watch/i));
    
    fireEvent.click(screen.getByText(/View Seller Profile/i));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/user/u1');
  });

  it('displays placeholder text when there are no bids', async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: { ...mockAuction, bids: [] }
    });
    
    render(<AdminAuctionDetails />);
    await waitFor(() => {
      expect(screen.getByText(/No bids have been placed yet/i)).toBeInTheDocument();
    });
  });

  it('handles auction that has already ended', async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: { 
        ...mockAuction, 
        auctionEnd: new Date(Date.now() - 86400000).toISOString() 
      }
    });
    
    render(<AdminAuctionDetails />);
    await waitFor(() => {
      expect(screen.getByText(/Auction Ended On/i)).toBeInTheDocument();
    });
  });

  it('handles missing product images gracefully', async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: { ...mockAuction, productImages: [] }
    });
    
    render(<AdminAuctionDetails />);
    await waitFor(() => {
      const img = screen.getByAltText(/Vintage Watch/i);
      expect(img).toHaveAttribute('src', 'https://via.placeholder.com/800x400');
    });
  });

  it('handles missing sellerId gracefully', async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: { ...mockAuction, sellerId: null }
    });
    
    render(<AdminAuctionDetails />);
    await waitFor(() => {
      expect(screen.getByText(/Private Seller/i)).toBeInTheDocument();
    });
  });

  it('handles missing currentHighestBid gracefully', async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: { ...mockAuction, currentHighestBid: null }
    });
    
    render(<AdminAuctionDetails />);
    await waitFor(() => {
      // The starting price should be displayed in the highest bid spot
      const currentHighestHeading = screen.getByText('Current Highest').nextElementSibling;
      expect(currentHighestHeading).toHaveTextContent('₹5000');
    });
  });

  it('handles undefined bids array gracefully', async () => {
    adminService.getMarketProductDetails.mockResolvedValueOnce({
      data: { ...mockAuction, bids: undefined }
    });
    
    render(<AdminAuctionDetails />);
    await waitFor(() => {
      expect(screen.getByText(/No bids have been placed yet/i)).toBeInTheDocument();
      // Total bids count should be 0
      const totalBidsHeading = screen.getByText('Total Bids').nextElementSibling;
      expect(totalBidsHeading).toHaveTextContent('0');
    });
  });
});
