import { render, screen, fireEvent } from '../../utils/test-utils';
import MediaImage from '../MediaImage';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../utils/mediaUrl', () => ({
  getMediaUrl: (id, type) => `/mock-media/${id}/${type}`
}));

describe('MediaImage Component', () => {
  it('renders an image with correct src and alt', () => {
    render(<MediaImage mediaId="123" type="thumb" alt="Test Image" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/mock-media/123/thumb');
    expect(img).toHaveAttribute('alt', 'Test Image');
  });

  it('falls back to placeholder on error', () => {
    render(<MediaImage mediaId="123" />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/placeholders/missing.png');
  });
});
