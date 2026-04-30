import React from 'react';
import { render, screen, fireEvent } from '../../utils/test-utils';
import AllServices from '../AllServices';
import { describe, it, expect, vi } from 'vitest';

describe('AllServices Page', () => {
  it('renders all categories initially', () => {
    render(<AllServices />);
    expect(screen.getByText(/All Services/i)).toBeDefined();
  });

  it('filters services based on search input', async () => {
    render(<AllServices />);
    
    const searchInput = screen.getByPlaceholderText(/Search services/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentService' } });
    
    expect(screen.getByText(/No services found/i)).toBeDefined();
  });

  it('clears search input', () => {
    render(<AllServices />);
    
    const searchInput = screen.getByPlaceholderText(/Search services/i);
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    const clearBtn = screen.getAllByRole('button', { name: '' })[0]; // The X button
    fireEvent.click(clearBtn);
    
    expect(searchInput.value).toBe('');
  });
});
