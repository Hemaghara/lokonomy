import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import SellProduct from '../SellProduct';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { marketService } from '../../services';

vi.mock('../../services', () => ({
  marketService: { addProduct: vi.fn().mockResolvedValue({ data: { success: true } }) },
}));

vi.mock('../../components/MapPicker', () => ({
  default: ({ value, onChange }) => (
    <div data-testid="map-picker">
      <button onClick={() => onChange({ lat: 23.0, lng: 72.5, address: 'Ahmedabad, Gujarat', pincode: '380001' })}>
        Select Location
      </button>
    </div>
  )
}));

vi.mock('../../context/LocationContext', () => ({
  LocationProvider: ({ children }) => <div data-testid="location-provider">{children}</div>,
  useLocation: () => ({ state: 'Gujarat', availableDistricts: ['Ahmedabad'] }),
}));

vi.mock('../../hooks/usePlanLimits', () => ({
  usePlanLimits: () => ({ limits: { productsUploaded: 10 } }),
}));

vi.mock('../../data/marketCategories', () => ({
  MARKET_CATEGORIES: { Electronics: ['Phones', 'Laptops'], Furniture: ['Tables', 'Chairs'] },
}));

vi.mock('react-hot-toast', () => {
  const t = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() });
  return { default: t, toast: t, Toaster: () => null };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => { const f={...p};['initial','animate','exit','transition','layout','whileHover','whileTap','whileInView','layoutId'].forEach(k=>delete f[k]); return <div {...f}>{children}</div>; },
    span: ({ children, ...p }) => { const f={...p};['initial','animate','exit','transition','layout','whileHover','whileTap'].forEach(k=>delete f[k]); return <span {...f}>{children}</span>; },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('SellProduct Page', () => {
  beforeEach(() => { vi.clearAllMocks(); window.confirm = vi.fn(() => true); });

  it('renders the product listing form', () => {
    render(<SellProduct />);
    expect(screen.getByText(/List Your Product/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/e.g. Professional Camera Setup/i)).toBeDefined();
  });

  it('submits the form successfully', async () => {
    render(<SellProduct />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Professional Camera Setup/i), { target: { value: 'Test iPhone' } });
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '50000' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe the item/i), { target: { value: 'Brand new condition' } });
    fireEvent.click(screen.getAllByText('Select Location')[0]);
    fireEvent.change(screen.getByPlaceholderText(/\+91 Phone Number/i), { target: { value: '9876543210' } });
    const submitBtn = screen.getAllByRole('button', { name: /Publish Listing/i })[0];
    fireEvent.click(submitBtn);
  });

  it('toggles auction settings', async () => {
    render(<SellProduct />);
    const auctionToggle = screen.getByText(/Enable Bidding/i);
    fireEvent.click(auctionToggle);
    expect(screen.getByText(/Starting Price/i)).toBeDefined();
    expect(screen.getByText(/Auction End Date/i)).toBeDefined();
  });

  it('shows platinum alert for featured listing when user is free', async () => {
    render(<SellProduct />);
    const featuredToggle = screen.getByText(/Featured Listing/i);
    fireEvent.click(featuredToggle);
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Featured listings are exclusive to Platinum members'));
  });
});
