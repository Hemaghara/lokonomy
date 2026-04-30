import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import PostStory from '../PostStory';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storyService } from '../../services';

// Mock storyService
vi.mock('../../services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    storyService: {
      createStory: vi.fn().mockResolvedValue({
        data: { success: true, message: 'Broadcasted successfully!' }
      }),
    },
  };
});

// Mock MapPicker
vi.mock('../../components/MapPicker', () => ({
  default: ({ value, onChange }) => (
    <div data-testid="map-picker">
      <button 
        type="button" 
        onClick={() => onChange({ lat: 12.34, lng: 56.78, address: 'Test Address', pincode: '123456' })}
      >
        Select Location
      </button>
    </div>
  )
}));

describe('PostStory Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the broadcast form', () => {
    render(<PostStory />);
    expect(screen.getByText(/Share Local Update/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Write your community update here/i)).toBeDefined();
  });

  it('validates location selection before submission', async () => {
    render(<PostStory />);
    
    fireEvent.change(screen.getByPlaceholderText(/e.g. New Local Shop Opening/i), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByPlaceholderText(/Write your community update here/i), { target: { value: 'Test Content' } });

    const submitBtn = screen.getAllByRole('button', { name: /Broadcast Update/i })[0];
    fireEvent.click(submitBtn);

    // Should show error toast (handled in component)
    expect(storyService.createStory).not.toHaveBeenCalled();
  });

  it('submits the form successfully after selecting location', async () => {
    render(<PostStory />);
    
    // Select location via mocked MapPicker
    fireEvent.click(screen.getAllByText('Select Location')[0]);

    fireEvent.change(screen.getByPlaceholderText(/e.g. New Local Shop Opening/i), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByPlaceholderText(/Write your community update here/i), { target: { value: 'Test Content' } });

    const submitBtn = screen.getAllByRole('button', { name: /Broadcast Update/i })[0];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(storyService.createStory).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Title',
        content: 'Test Content',
        latitude: 12.34,
        longitude: 56.78
      }));
    });
  });

  it('prevents highlight toggle for free members', async () => {
    // Note: User context is provided by test-utils. Default user in test-utils is 'free'
    render(<PostStory />);
    
    const highlightToggle = screen.getByLabelText(/Pin to Highlights/i);
    fireEvent.click(highlightToggle);

    // Should query the checkbox status - it should stay unchecked or toast error shown
    expect(highlightToggle).not.toBeChecked();
  });
});
