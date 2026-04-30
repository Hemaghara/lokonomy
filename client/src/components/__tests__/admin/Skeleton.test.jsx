import { render, screen } from '../../../utils/test-utils';
import { TableSkeleton, CardSkeleton, StatsSkeleton } from '../../admin/Skeleton';
import { describe, it, expect, vi } from 'vitest';

describe('Skeleton Components', () => {
  it('renders TableSkeleton without crashing', () => {
    render(<TableSkeleton />);
  });

  it('renders CardSkeleton without crashing', () => {
    render(<CardSkeleton />);
  });

  it('renders StatsSkeleton without crashing', () => {
    render(<StatsSkeleton />);
  });
});
