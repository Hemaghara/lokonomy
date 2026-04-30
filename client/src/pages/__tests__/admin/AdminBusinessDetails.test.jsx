import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminBusinessDetails from '../../admin/AdminBusinessDetails';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'b1' }),
    useNavigate: () => vi.fn(),
  };
});
import { adminService } from '../../../services';

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getBusinessDetails: vi.fn().mockResolvedValue({
      data: {
        _id: 'b1',
        businessName: 'Gourmet Bakery',
        mainCategory: 'Food',
        subCategory: 'Bakery',
        status: 'active',
        email: 'bakery@example.com',
        phone: '1234567890',
        website: 'https://bakery.com',
        description: 'The best bakery in town',
        district: 'Mumbai',
        taluka: 'Andheri',
        location: { coordinates: [19.1, 72.8] },
        logo: 'logo.png',
        visits: 500,
        rating: 4.8,
        reviews: [{}, {}],
        products: [
          { _id: 'p1', productName: 'Croissant', price: 50, productImages: ['c.png'], mainCategory: 'Bread' }
        ],
        photos: ['p1.png', 'p2.png'],
        ownerId: {
          _id: 'u1',
          name: 'Baker Joe',
          email: 'joe@example.com',
          profilePic: 'joe.png'
        },
        createdAt: new Date().toISOString()
      }
    }),
    getBusinessScore: vi.fn().mockResolvedValue({
      data: {
        score: 85,
        signals: [
          { label: 'Active Subscription', type: 'positive', points: 20 },
          { label: 'Low Response Rate', type: 'negative', points: -5 }
        ]
      }
    }),
    deleteContent: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

describe('AdminBusinessDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('renders business header and main details', async () => {
    render(<AdminBusinessDetails />);

    const businessNames = await screen.findAllByText(/Gourmet Bakery/i);
    expect(businessNames[0]).toBeDefined();
    expect(screen.getAllByText(/Food/i)[0]).toBeDefined();
    expect(screen.getAllByText(/active/i)[0]).toBeDefined();
    expect(screen.getAllByText(/bakery@example.com/i)[0]).toBeDefined();
  });

  it('renders owner information and navigation link', async () => {
    render(<AdminBusinessDetails />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Baker Joe')[0]).toBeDefined();
      expect(screen.getAllByText('joe@example.com')[0]).toBeDefined();
      const ownerLink = screen.getByRole('link', { name: /Baker Joe/i });
      expect(ownerLink.getAttribute('href')).toBe('/admin/user/u1');
    });
  });

  it('renders health scorecard and signals', async () => {
    render(<AdminBusinessDetails />);
    
    await waitFor(() => {
      expect(screen.getAllByText('85')[0]).toBeDefined();
      expect(screen.getAllByText('Active Subscription')[0]).toBeDefined();
      expect(screen.getAllByText('+20')[0]).toBeDefined();
      expect(screen.getAllByText('-5')[0]).toBeDefined();
    });
  });

  it('handles tab switching (Gallery, Products)', async () => {
    render(<AdminBusinessDetails />);
    
    await waitFor(() => screen.getAllByText('Gourmet Bakery')[0]);

    // Gallery Tab
    fireEvent.click(screen.getAllByText('gallery')[0]);
    await waitFor(() => {
      expect(screen.getAllByText('Media #1')[0]).toBeDefined();
    });

    // Products Tab
    fireEvent.click(screen.getAllByText('products')[0]);
    await waitFor(() => {
      expect(screen.getAllByText('Croissant')[0]).toBeDefined();
      expect(screen.getAllByText('₹50')[0]).toBeDefined();
    });
  });

  it('handles business deletion', async () => {
    render(<AdminBusinessDetails />);
    
    await waitFor(() => screen.getAllByText('Gourmet Bakery')[0]);

    const deleteBtn = screen.getAllByRole('button', { name: /Delete business/i })[0];
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(adminService.deleteContent).toHaveBeenCalledWith('business', 'b1');
    });
  });
});
