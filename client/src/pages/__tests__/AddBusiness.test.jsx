import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import AddBusiness from '../AddBusiness';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { businessService } from '../../services';

// Mock services
vi.mock('../../services', () => ({
  businessService: {
    addBusiness: vi.fn().mockResolvedValue({ data: { success: true, business: { _id: 'b1' } } }),
  },
  generateBusinessDescription: vi.fn().mockResolvedValue('AI generated description'),
}));

// Mock MapPicker
vi.mock('../../components/MapPicker', () => ({
  default: ({ onChange }) => (
    <button onClick={() => onChange({ lat: 1, lng: 1, address: 'Test Address' })}>
      Pick Location
    </button>
  ),
}));

describe('Add Business Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the registration form correctly', async () => {
    render(<AddBusiness />);
    
    expect(screen.getByText(/Register Your Business/i)).toBeDefined();
    expect(screen.getByText(/Business Profile/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/e.g. Neo Electronics/i)).toBeDefined();
  });

  it('handles form field changes', async () => {
    render(<AddBusiness />);
    
    const businessNameInput = screen.getByPlaceholderText(/e.g. Neo Electronics/i);
    fireEvent.change(businessNameInput, { target: { name: 'businessName', value: 'Test Shop' } });
    
    expect(businessNameInput.value).toBe('Test Shop');
  });

  it('handles business submission', async () => {
    render(<AddBusiness />);
    
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/e.g. Neo Electronics/i), { 
      target: { name: 'businessName', value: 'Test Shop' } 
    });
    
    // Select category (Main Category)
    const categorySelect = screen.getByRole('combobox', { name: /Main Category/i });
    fireEvent.change(categorySelect, { target: { value: 'Electronics' } });
    
    // Select sub-category
    await waitFor(() => {
      const subCategorySelect = screen.getByRole('combobox', { name: /Sub Category/i });
      fireEvent.change(subCategorySelect, { target: { value: 'Mobile' } });
    });

    // Fill contact
    fireEvent.change(screen.getByPlaceholderText(/82009 73720/i), { 
      target: { name: 'contactNumber', value: '1234567890' } 
    });

    // Pick location
    fireEvent.click(screen.getByText(/Pick Location/i));

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Register Business/i });
    fireEvent.submit(submitBtn.closest('form'));

    await waitFor(() => {
      expect(businessService.addBusiness).toHaveBeenCalled();
    }, { timeout: 5000 });
  });
});

