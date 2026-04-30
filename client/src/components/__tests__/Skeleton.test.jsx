import { render } from '../../utils/test-utils';
import Skeleton, { CardSkeleton, ProductSkeleton, MarketSkeleton, BusinessDetailsSkeleton, ProductDetailsSkeleton } from '../Skeleton';
import { describe, it, expect } from 'vitest';

describe('Skeleton Components', () => {
  it('renders base skeleton with custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.querySelector('.skeleton')).toHaveClass('custom-class');
  });
 
  it('renders CardSkeleton', () => {
    const { container } = render(<CardSkeleton />);
    expect(container.querySelector('.card')).toBeInTheDocument();
  });
 
  it('renders ProductSkeleton', () => {
    const { container } = render(<ProductSkeleton />);
    expect(container.querySelector('.bg-\\[\\#0d1120\\]')).toBeInTheDocument();
  });
 
  it('renders MarketSkeleton with 8 product skeletons', () => {
    const { container } = render(<MarketSkeleton />);
    const skeletons = container.querySelectorAll('.bg-\\[\\#0d1120\\]');
    expect(skeletons).toHaveLength(8);
  });
 
  it('renders BusinessDetailsSkeleton', () => {
    const { container } = render(<BusinessDetailsSkeleton />);
    expect(container.querySelector('.max-w-7xl')).toBeInTheDocument();
  });
 
  it('renders ProductDetailsSkeleton', () => {
    const { container } = render(<ProductDetailsSkeleton />);
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
  });
});
