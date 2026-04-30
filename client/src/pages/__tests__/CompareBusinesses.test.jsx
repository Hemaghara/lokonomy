import React from 'react';
import { render, screen, waitFor } from '../../utils/test-utils';
import CompareBusinesses from '../CompareBusinesses';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { businessService } from '../../services';

// Mock businessService
vi.mock('../../services', () => ({
  businessService: {
    getBusinessById: vi.fn().mockImplementation((id) => Promise.resolve({
      data: {
        _id: id,
        businessName: `Business ${id}`,
        subCategory: 'Retail',
        rating: 4.5,
        locationAddress: 'Market Street',
        openingHours: '9 AM - 6 PM',
        phone: '1234567890',
        isVerified: true,
        description: 'Quality local business.'
      }
    })),
  }
}));

describe('CompareBusinesses Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no IDs are provided', () => {
    render(<CompareBusinesses />, { initialEntries: ['/compare'] });
    
    expect(screen.getByText(/No businesses selected/i)).toBeDefined();
  });

  it('renders comparison cards for provided IDs', async () => {
    render(<CompareBusinesses />, { initialEntries: ['/compare?ids=b1,b2'] });
    
    await waitFor(() => {
      expect(screen.getAllByText('Business b1')[0]).toBeDefined();
      expect(screen.getAllByText('Business b2')[0]).toBeDefined();
    });

    expect(screen.getAllByText('Retail').length).toBe(2);
    expect(screen.getAllByText('9 AM - 6 PM').length).toBe(2);
  });

  it('navigates to business profile', async () => {
    render(<CompareBusinesses />, { initialEntries: ['/compare?ids=b1'] });
    
    await waitFor(() => screen.getAllByText('Business b1')[0]);
    
    const link = screen.getByText(/View Profile/i);
    expect(link.getAttribute('href')).toBe('/business/b1');
  });
});
