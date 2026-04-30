import { render, screen, waitFor, fireEvent } from '../../utils/test-utils';
import Highlights from '../Highlights';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storyService } from '../../services';

vi.mock('../../services', () => ({
  storyService: {
    getHighlights: vi.fn()
  }
}));

describe('Highlights Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    storyService.getHighlights.mockReturnValue(new Promise(() => {}));
    const { container } = render(<Highlights ownerId="1" />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders highlights and handles click', async () => {
    storyService.getHighlights.mockResolvedValueOnce({
      data: {
        data: [
          { _id: '1', title: 'Test Highlight', highlightCategory: 'Offers', author: 'Owner', content: 'Test content' }
        ]
      }
    });

    render(<Highlights ownerId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Business Highlights')).toBeInTheDocument();
      expect(screen.getByText('Offers')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Offers'));
    
    await waitFor(() => {
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  it('returns null if no highlights', async () => {
    storyService.getHighlights.mockResolvedValueOnce({ data: { data: [] } });
    const { container } = render(<Highlights ownerId="1" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Business Highlights')).not.toBeInTheDocument();
    });
  });
});
