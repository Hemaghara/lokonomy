import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Services from '../Services';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { businessService } from '../../services';

// Mock businessService
vi.mock('../../services', () => ({
  businessService: {
    getBusinesses: vi.fn().mockResolvedValue({
      data: [
        { 
          _id: 'b1', 
          businessName: 'Premium Spa', 
          subCategory: 'Beauty', 
          rating: 4.8, 
          locationAddress: 'Downtown',
          logo: 'spa.jpg',
          description: 'Relaxing spa services.'
        },
        { 
          _id: 'b2', 
          businessName: 'Local Salon', 
          subCategory: 'Hair', 
          rating: 4.2, 
          locationAddress: 'Uptown' 
        }
      ]
    }),
  }
}));

// Mock BusinessMapView
vi.mock('../../components/BusinessMapView', () => ({
  default: () => <div data-testid="mock-map">Mock Map View</div>
}));

describe('Services Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders services and category header', async () => {
    render(<Services />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Premium Spa')[0]).toBeDefined();
      expect(screen.getAllByText('Local Salon')[0]).toBeDefined();
    }, { timeout: 5000 });
  });

  it('filters results based on search query', async () => {
    render(<Services />);
    
    await waitFor(() => screen.getAllByText('Premium Spa')[0], { timeout: 5000 });

    const searchInput = screen.getByPlaceholderText(/Search by name/i);
    fireEvent.change(searchInput, { target: { value: 'Premium' } });

    expect(screen.getAllByText('Premium Spa')[0]).toBeDefined();
    expect(screen.queryByText('Local Salon')).toBeNull();
  });

  it('toggles between list and map view', async () => {
    render(<Services />);
    
    await waitFor(() => screen.getAllByText('Premium Spa')[0], { timeout: 5000 });

    const mapBtn = screen.getAllByRole('button', { name: /Map/i })[0];
    fireEvent.click(mapBtn);

    await waitFor(() => {
      expect(screen.getByTestId('mock-map')).toBeDefined();
    }, { timeout: 5000 });
  });

  it('handles comparison mode selection', async () => {
    render(<Services />);
    
    await waitFor(() => screen.getAllByText('Premium Spa')[0], { timeout: 5000 });

    const compareBtn = screen.getAllByRole('button', { name: /Compare Mode/i })[0];
    fireEvent.click(compareBtn);

    const selectBtn = screen.getAllByText(/\+ Add to Compare/i)[0];
    fireEvent.click(selectBtn);
  });

  it('handles geolocation denial gracefully', async () => {
    // Mock geolocation error
    const originalGeolocation = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn().mockImplementationOnce((success, error) => error({
          code: 1,
          message: 'User denied Geolocation'
        }))
      },
      configurable: true
    });
    
    render(<Services />);
    
    await waitFor(() => {
      expect(screen.getByText(/Location access denied/i)).toBeDefined();
    }, { timeout: 5000 });

    Object.defineProperty(navigator, 'geolocation', { value: originalGeolocation, configurable: true });
  });
});

