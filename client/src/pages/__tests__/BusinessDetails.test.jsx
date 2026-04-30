import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import BusinessDetails from '../BusinessDetails';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { businessService } from '../../services';

// Mock recommendationService directly since it's imported directly in the component
vi.mock('../../services/recommendationService', () => ({
  __esModule: true,
  default: {
    trackInteraction: vi.fn().mockResolvedValue({ data: { success: true } }),
    trackView: vi.fn().mockResolvedValue({ data: { success: true } }),
  }
}));

// Mock services barrel
vi.mock('../../services', () => ({
  businessService: {
    getBusinessById: vi.fn().mockResolvedValue({
      data: {
        _id: 'biz-1',
        businessName: 'Premium Spa',
        ownerName: 'Alice',
        ownerId: 'owner-1',
        description: 'Luxury treatments',
        rating: 4.5,
        reviews: [
          { userName: 'Bob', rating: 5, comment: 'Great!', createdAt: new Date().toISOString() }
        ],
        mainCategory: 'Wellness',
        subCategory: 'Spa',
        locationAddress: '123 Zen Lane',
        verified: true,
        contactNumber: '1234567890',
        businessHours: {
          Monday: { isOpen: true, startTime: '09:00', endTime: '18:00' }
        },
        location: { coordinates: [77.12, 28.61] }, // [long, lat]
      }
    }),
    incrementVisits: vi.fn(),
    addReview: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
  storyService: {
    getHighlights: vi.fn().mockResolvedValue({ data: { data: [] } }),
  }
}));

// Mock Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
}));

describe('BusinessDetails Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders business details correctly', async () => {
    render(<BusinessDetails />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Premium Spa')[0]).toBeDefined();
      expect(screen.getByText(/Luxury treatments/i)).toBeDefined();
      expect(screen.getAllByText('Verified')[0]).toBeDefined();
      expect(screen.getAllByText('4.5')[0]).toBeDefined();
    });
  });

  it('switches tabs and displays reviews', async () => {
    render(<BusinessDetails />);
    
    await waitFor(() => screen.getAllByText('Premium Spa')[0]);

    const reviewsTab = screen.getAllByRole('button', { name: /Reviews/i })[0];
    fireEvent.click(reviewsTab);

    await waitFor(() => {
      expect(screen.getAllByText('Bob')[0]).toBeDefined();
      expect(screen.getAllByText('Great!')[0]).toBeDefined();
    });
  });

  it('shows map when coordinates are available', async () => {
    render(<BusinessDetails />);
    
    await waitFor(() => {
      expect(screen.getByTestId('map')).toBeDefined();
    });
  });

  it('shows business hours correctly', async () => {
    render(<BusinessDetails />);
    
    await waitFor(() => screen.getAllByText('Premium Spa')[0]);

    expect(screen.getAllByText('Mon')[0]).toBeDefined();
    expect(screen.getByText(/9:00 AM/i)).toBeDefined();
    expect(screen.getByText(/6:00 PM/i)).toBeDefined();
  });
});
