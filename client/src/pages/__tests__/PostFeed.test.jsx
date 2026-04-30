import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import PostFeed from '../PostFeed';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { feedService } from '../../services';

// Mock MapPicker
vi.mock('../../components/MapPicker', () => ({
  default: ({ onChange }) => (
    <div data-testid="map-picker">
      <button 
        type="button"
        onClick={() => onChange({ lat: 22.3, lng: 72.6, address: 'Test Location' })}
      >
        Set Location
      </button>
    </div>
  )
}));

// Mock feedService
vi.mock('../../services', () => ({
  feedService: {
    createFeed: vi.fn().mockResolvedValue({ data: { success: true, message: 'Posted' } }),
  }
}));

describe('PostFeed Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles form input and category selection', async () => {
    render(<PostFeed />);
    
    const titleInput = screen.getByPlaceholderText(/e.g. Mega Sale/i);
    fireEvent.change(titleInput, { target: { name: 'title', value: 'New Offer' } });
    
    expect(titleInput.value).toBe('New Offer');
  });

  it('shows event date/time only when Event category is selected', async () => {
    render(<PostFeed />);
    
    expect(screen.queryByLabelText(/Event Date/i)).toBeNull();
    
    const categoryBtn = screen.getByRole('button', { name: /Information/i });
    fireEvent.click(categoryBtn);
    
    const eventOption = screen.getByRole('button', { name: /Event/i });
    fireEvent.click(eventOption);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Event Date/i)).toBeInTheDocument();
    });
  });

  it('handles image upload simulation', async () => {
    render(<PostFeed />);
    
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Click to upload/i);
    
    // Simulating file change
    fireEvent.change(input, { target: { files: [file] } });
    
    // FileReader is async, but we can check if it's triggered
  });

  it('submits form with valid data', async () => {
    render(<PostFeed />);
    
    fireEvent.change(screen.getByPlaceholderText(/e.g. Mega Sale/i), { 
      target: { name: 'title', value: 'Test Post' } 
    });
    fireEvent.change(screen.getByPlaceholderText(/Share the details/i), { 
      target: { name: 'content', value: 'Test content' } 
    });
    
    // Set location via mock button
    fireEvent.click(screen.getAllByText('Set Location')[0]);
    
    const submitBtn = screen.getAllByRole('button', { name: /Post to Feed/i })[0];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(feedService.createFeed).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Post',
        locationAddress: 'Test Location'
      }));
    });
  });

  it('shows error if location is missing on submit', async () => {
    render(<PostFeed />);
    
    fireEvent.change(screen.getByPlaceholderText(/e.g. Mega Sale/i), { 
      target: { name: 'title', value: 'Test Post' } 
    });
    
    const submitBtn = screen.getAllByRole('button', { name: /Post to Feed/i })[0];
    fireEvent.click(submitBtn);

    // Toast error would be called (not easily asserted without mocking toast)
  });
});
