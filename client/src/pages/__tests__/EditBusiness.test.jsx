import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import EditBusiness from '../EditBusiness';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { businessService, generateBusinessDescription } from '../../services';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'b1' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock services
vi.mock('../../services', () => ({
  businessService: {
    getBusinessById: vi.fn().mockResolvedValue({
      data: {
        _id: 'b1',
        businessName: 'Original Name',
        ownerName: 'Owner',
        mainCategory: 'Electronics',
        subCategory: 'Smartphones',
        contactNumber: '1234567890',
        location: { coordinates: [72.5, 23.0] }
      }
    }),
    updateBusiness: vi.fn().mockResolvedValue({
      data: { success: true, business: { _id: 'b1' } }
    }),
  },
  generateBusinessDescription: vi.fn().mockResolvedValue('AI Generated Description'),
}));

// Mock MapPicker
vi.mock('../../components/MapPicker', () => ({
  default: ({ value, onChange }) => (
    <div data-testid="map-picker">
      <button onClick={() => onChange({ lat: 23.0, lng: 72.5, address: 'Updated Address' })}>
        Move Marker
      </button>
    </div>
  )
}));

describe('EditBusiness Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays business data on load', async () => {
    render(<EditBusiness />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Original Name')).toBeDefined();
    });
  });

  it('generates description using AI', async () => {
    render(<EditBusiness />);
    
    await waitFor(() => screen.getByDisplayValue('Original Name'));

    const aiBtn = screen.getByText(/Generate with AI/i);
    fireEvent.click(aiBtn);

    await waitFor(() => {
      expect(generateBusinessDescription).toHaveBeenCalled();
      expect(screen.getByPlaceholderText(/Tell customers about your services/i).value).toBe('AI Generated Description');
    });
  });

  it('updates business details successfully', async () => {
    render(<EditBusiness />);
    
    await waitFor(() => screen.getByDisplayValue('Original Name'));

    fireEvent.change(screen.getByPlaceholderText(/e.g. Neo Electronics/i), { target: { value: 'New Name' } });
    
    const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.submit(submitBtn.closest('form'));


    await waitFor(() => {
      expect(businessService.updateBusiness).toHaveBeenCalledWith('b1', expect.objectContaining({
        businessName: 'New Name'
      }));
    }, { timeout: 5000 });
  });
});


