import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import ReportModal from '../ReportModal';
import { describe, it, expect, vi } from 'vitest';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      post: vi.fn()
    }
  };
});
 
vi.mock('react-hot-toast', async (importOriginal) => {
  const actual = await importOriginal();
  const mockToast = vi.fn();
  mockToast.success = vi.fn();
  mockToast.error = vi.fn();
  return {
    ...actual,
    default: mockToast,
    toast: mockToast,
  };
});

describe('ReportModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(<ReportModal isOpen={false} />);
    expect(screen.queryByText('Report Content')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(<ReportModal isOpen={true} targetType="user" targetId="123" onClose={vi.fn()} />);
    expect(screen.getByText('Report Content')).toBeInTheDocument();
    expect(screen.getByText('Spam')).toBeInTheDocument();
  });

  it('shows error if submitted without a reason', async () => {
    render(<ReportModal isOpen={true} targetType="user" targetId="123" onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Submit Report'));
    expect(toast.error).toHaveBeenCalledWith('Please select a reason');
  });

  it('submits report successfully', async () => {
    const onClose = vi.fn();
    api.post.mockResolvedValueOnce({});
    render(<ReportModal isOpen={true} targetType="user" targetId="123" onClose={onClose} />);
    
    fireEvent.click(screen.getByText('Spam'));
    fireEvent.change(screen.getByPlaceholderText(/Tell us more/), { target: { value: 'Test description' } });
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/reports', {
        targetType: 'user',
        targetId: '123',
        reason: 'Spam',
        description: 'Test description'
      });
      expect(toast.success).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles api errors gracefully', async () => {
    api.post.mockRejectedValueOnce(new Error('API error'));
    render(<ReportModal isOpen={true} targetType="user" targetId="123" onClose={vi.fn()} />);
    
    fireEvent.click(screen.getByText('Spam'));
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to submit report');
    });
  });
});
