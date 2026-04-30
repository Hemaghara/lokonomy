import { render, screen, fireEvent } from '../../../utils/test-utils';
import ConfirmModal from '../../admin/ConfirmModal';
import { describe, it, expect, vi } from 'vitest';
import { useConfirmState } from '../../../context/ConfirmContext';

vi.mock('../../../context/ConfirmContext', () => ({
  useConfirmState: vi.fn(),
  ConfirmProvider: ({ children }) => <div data-testid="confirm-provider">{children}</div>
}));

describe('ConfirmModal Component', () => {
  it('does not render if not open', () => {
    useConfirmState.mockReturnValue({ modalState: { isOpen: false }, closeConfirm: vi.fn() });
    render(<ConfirmModal />);
    expect(screen.queryByText(/Cancel/i)).not.toBeInTheDocument();
  });

  it('renders modal when open', () => {
    useConfirmState.mockReturnValue({
      modalState: { 
        isOpen: true, 
        title: 'Delete Item', 
        description: 'Are you sure?', 
        confirmLabel: 'Delete', 
        isDanger: true, 
        onConfirm: vi.fn() 
      },
      closeConfirm: vi.fn()
    });
    
    render(<ConfirmModal />);
    
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    useConfirmState.mockReturnValue({
      modalState: { 
        isOpen: true, 
        title: 'Delete Item', 
        description: 'Are you sure?', 
        confirmLabel: 'Delete', 
        isDanger: true, 
        onConfirm 
      },
      closeConfirm: vi.fn()
    });
    
    render(<ConfirmModal />);
    
    fireEvent.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls closeConfirm when cancel button is clicked', () => {
    const closeConfirm = vi.fn();
    useConfirmState.mockReturnValue({
      modalState: { 
        isOpen: true, 
        title: 'Delete Item', 
        description: 'Are you sure?', 
        confirmLabel: 'Delete', 
        isDanger: true, 
        onConfirm: vi.fn() 
      },
      closeConfirm
    });
    
    render(<ConfirmModal />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(closeConfirm).toHaveBeenCalled();
  });
});
