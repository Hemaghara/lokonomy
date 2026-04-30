import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import ComparisonDock from '../ComparisonDock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useComparison } from '../../context/ComparisonContext';
import { businessService } from '../../services';

vi.mock('../../context/ComparisonContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useComparison: vi.fn()
  };
});
 
vi.mock('../../services', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    businessService: {
      getBusinessById: vi.fn()
    }
  };
});

describe('ComparisonDock Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing if selectedIds is empty', () => {
    useComparison.mockReturnValue({ selectedIds: [], toggleSelection: vi.fn(), clearSelection: vi.fn() });
    render(<ComparisonDock />);
    expect(screen.queryByText(/Compare/)).not.toBeInTheDocument();
  });

  it('renders dock when items are selected', async () => {
    useComparison.mockReturnValue({ selectedIds: ['1'], toggleSelection: vi.fn(), clearSelection: vi.fn() });
    businessService.getBusinessById.mockResolvedValue({ data: { _id: '1', name: 'Biz 1' } });
    
    render(<ComparisonDock />);
    
    await waitFor(() => {
      expect(screen.getByText(/Select one more to unlock comparison/)).toBeInTheDocument();
    });
  });

  it('calls clearSelection when reset is clicked', async () => {
    const clearSelection = vi.fn();
    useComparison.mockReturnValue({ selectedIds: ['1'], toggleSelection: vi.fn(), clearSelection });
    businessService.getBusinessById.mockResolvedValue({ data: { _id: '1', name: 'Biz 1' } });
    
    render(<ComparisonDock />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      expect(clearSelection).toHaveBeenCalled();
    });
  });
});
