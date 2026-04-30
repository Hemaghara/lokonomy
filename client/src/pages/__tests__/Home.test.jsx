import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Home from '../Home';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock services
vi.mock('../../services/recommendationService', () => ({
  default: {
    getRecommendations: vi.fn().mockResolvedValue({
      businesses: [{ _id: 'b1', businessName: 'Local Shop', category: 'Retail', images: ['b.jpg'], rating: 4.5 }],
      products: [{ _id: 'p1', productName: 'Handmade Soap', price: 200, productImages: ['p.jpg'] }],
      jobs: [{ _id: 'j1', position: 'Software Dev', companyName: 'Tech Co', type: 'Full-time' }]
    }),
    trackInteraction: vi.fn(),
  }
}));

vi.mock('../../services', () => ({
  feedService: {
    getFeeds: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: [{ _id: 'e1', title: 'Local Festival', type: 'Event', createdAt: new Date() }]
      }
    })
  }
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hero section and stats', async () => {
    render(<Home />);
    
    // Use regex to be flexible with text nodes
    expect(screen.getByText(/Empowering Your/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Users/i)).toBeInTheDocument();
    expect(screen.getByText(/2k\+/i)).toBeInTheDocument();
  });

  it('renders recommendations after loading', async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Local Shop')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Handmade Soap')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Software Dev')[0]).toBeInTheDocument();
    });
  });

  it('renders categories', () => {
    render(<Home />);
    
    expect(screen.getByText(/Browse Categories/i)).toBeInTheDocument();
  });

  it('renders upcoming events', async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Local Festival')[0]).toBeInTheDocument();
    });
  });
});
