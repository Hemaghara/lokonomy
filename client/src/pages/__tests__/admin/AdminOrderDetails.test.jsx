import React from 'react';
import { render, screen, waitFor } from '../../../utils/test-utils';
import AdminOrderDetails from '../../admin/AdminOrderDetails';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock AdminLayout
vi.mock('../../../layouts/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'o1' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getMarketOrderDetails: vi.fn().mockResolvedValue({
      data: {
        _id: 'o1',
        orderStatus: 'shipped',
        createdAt: new Date().toISOString(),
        price: 1500,
        paymentMethod: 'razorpay',
        transactionId: 'txn_123456',
        contactNumber: '9988776655',
        shippingAddress: '456 Garden Street, Mehsana',
        product: {
          _id: 'p1',
          productName: 'Leather Bag',
          mainCategory: 'Fashion',
          subCategory: 'Bags',
          productImages: ['bag.png']
        },
        buyer: {
          name: 'Alice Buyer',
          email: 'alice@example.com'
        },
        seller: {
          name: 'Bob Seller',
          email: 'bob@example.com',
          mobile: '1122334455',
          location: { address: '789 Market Yard, Kadi' }
        }
      }
    })
  }
}));

describe('AdminOrderDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders order summary and status', async () => {
    render(<AdminOrderDetails />);

    await waitFor(() => {
      // The heading renders "Order #<last8chars>"
      expect(screen.getAllByText(/Order/i).length).toBeGreaterThan(0);
      // Status badge shows the orderStatus
      expect(screen.getAllByText(/shipped/i).length).toBeGreaterThan(0);
      // Price appears in multiple places (subtotal, total)
      expect(screen.getAllByText(/₹1500/i).length).toBeGreaterThan(0);
      // Transaction ID
      expect(screen.getByText(/txn_123456/i)).toBeInTheDocument();
    });
  });

  it('renders product details correctly', async () => {
    render(<AdminOrderDetails />);

    await waitFor(() => {
      expect(screen.getByText(/Leather Bag/i)).toBeInTheDocument();
      // Category rendered as "Fashion • Bags"
      expect(screen.getByText(/Fashion/i)).toBeInTheDocument();
      expect(screen.getByText(/Bags/i)).toBeInTheDocument();
    });
  });

  it('renders buyer and seller information', async () => {
    render(<AdminOrderDetails />);

    await waitFor(() => {
      expect(screen.getByText(/Alice Buyer/i)).toBeInTheDocument();
      expect(screen.getByText(/456 Garden Street, Mehsana/i)).toBeInTheDocument();
      expect(screen.getByText(/Bob Seller/i)).toBeInTheDocument();
      expect(screen.getByText(/789 Market Yard, Kadi/i)).toBeInTheDocument();
    });
  });

  it('renders fulfillment timeline correctly', async () => {
    render(<AdminOrderDetails />);

    await waitFor(() => {
      expect(screen.getByText(/Order Received/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Shipped/i).length).toBeGreaterThan(0);
      // "On the way..." subtitle is shown for the active "shipped" step
      expect(screen.getByText(/On the way/i)).toBeInTheDocument();
      expect(screen.getByText(/Delivered/i)).toBeInTheDocument();
    });
  });

  it('shows error state when order not found', async () => {
    adminService.getMarketOrderDetails.mockRejectedValueOnce(new Error('Not Found'));

    render(<AdminOrderDetails />);

    await waitFor(() => {
      expect(screen.getByText(/Order Not Found/i)).toBeInTheDocument();
    });
  });
});
