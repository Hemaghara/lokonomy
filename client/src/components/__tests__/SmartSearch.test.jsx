import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import SmartSearch from '../SmartSearch';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import recommendationService from '../../services/recommendationService';
import { useNavigate } from 'react-router-dom';

vi.mock('../../services/recommendationService', () => ({
  default: {
    getSuggestions: vi.fn(),
    trackInteraction: vi.fn()
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn()
  };
});

describe('SmartSearch Component', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('renders input field', () => {
    render(<SmartSearch />);
    expect(screen.getByPlaceholderText(/Search for businesses, products, or jobs/i)).toBeInTheDocument();
  });

  it('fetches and displays suggestions when typing', async () => {
    recommendationService.getSuggestions.mockResolvedValueOnce([
      { id: '1', type: 'business', text: 'Test Business' }
    ]);
    
    render(<SmartSearch />);
    
    const input = screen.getByPlaceholderText(/Search for businesses/i);
    fireEvent.change(input, { target: { value: 'Test' } });
    
    await waitFor(() => {
      expect(recommendationService.getSuggestions).toHaveBeenCalledWith('Test');
      expect(screen.getByText('Test Business')).toBeInTheDocument();
    });
  });

  it('navigates to correct route when suggestion is clicked', async () => {
    recommendationService.getSuggestions.mockResolvedValueOnce([
      { id: '1', type: 'product', text: 'Test Product' }
    ]);
    
    render(<SmartSearch />);
    
    const input = screen.getByPlaceholderText(/Search for businesses/i);
    fireEvent.change(input, { target: { value: 'Test' } });
    
    await waitFor(() => {
      const option = screen.getByText('Test Product');
      fireEvent.click(option);
    });
    
    expect(recommendationService.trackInteraction).toHaveBeenCalledWith('click', 'product', '1');
    expect(mockNavigate).toHaveBeenCalledWith('/market/product/1');
  });

  it('shows no results found when suggestions are empty', async () => {
    recommendationService.getSuggestions.mockResolvedValueOnce([]);
    
    render(<SmartSearch />);
    
    const input = screen.getByPlaceholderText(/Search for businesses/i);
    fireEvent.change(input, { target: { value: 'Test' } });
    
    await waitFor(() => {
      expect(screen.getByText('No results found for "Test"')).toBeInTheDocument();
    });
  });
});
