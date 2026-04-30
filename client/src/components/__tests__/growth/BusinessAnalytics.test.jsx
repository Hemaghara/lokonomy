import { render, screen, fireEvent, waitFor, act } from '../../../utils/test-utils';
import BusinessAnalytics from '../../growth/BusinessAnalytics';
import { growthService } from '../../../services';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services', () => ({
  growthService: {
    getAnalytics: vi.fn(),
  },
}));

// Mock ResizeObserver for Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock Recharts to avoid rendering issues in JSDOM
vi.mock('recharts', async () => {
    const actual = await vi.importActual('recharts');
    return {
        ...actual,
        ResponsiveContainer: ({ children }) => <div style={{ width: '100%', height: '100%' }}>{children}</div>,
    };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
}));

describe('BusinessAnalytics Component', () => {
  const businessId = 'biz123';
  const mockAnalyticsData = {
    visits: 1000,
    dailyVisits: [
      { date: '2023-10-01', count: 10 },
      { date: '2023-10-02', count: 20 },
      { date: '2023-10-03', count: 15 },
      { date: '2023-10-04', count: 30 },
      { date: '2023-10-05', count: 25 },
      { date: '2023-10-06', count: 40 },
      { date: '2023-10-07', count: 35 },
      { date: '2023-10-08', count: 50 },
      { date: '2023-10-09', count: 45 },
      { date: '2023-10-10', count: 60 },
      { date: '2023-10-11', count: 55 },
      { date: '2023-10-12', count: 70 },
      { date: '2023-10-13', count: 65 },
      { date: '2023-10-14', count: 80 },
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and fetches analytics on mount', async () => {
    growthService.getAnalytics.mockResolvedValue({ data: mockAnalyticsData });
    await act(async () => {
        render(<BusinessAnalytics businessId={businessId} />);
    });
    
    await waitFor(() => {
      expect(growthService.getAnalytics).toHaveBeenCalledWith(businessId);
    });
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('shows LockedOverlay if user does not have permission (403)', async () => {
    growthService.getAnalytics.mockRejectedValue({ response: { status: 403 } });
    await act(async () => {
        render(<BusinessAnalytics businessId={businessId} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Premium Insights/i)).toBeInTheDocument();
    });
  });

  it('correctly calculates growth percentage', async () => {
    growthService.getAnalytics.mockResolvedValue({ data: mockAnalyticsData });
    await act(async () => {
        render(<BusinessAnalytics businessId={businessId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('+143%')).toBeInTheDocument();
    });
  });

  it('renders week-over-week comparison bars', async () => {
    growthService.getAnalytics.mockResolvedValue({ data: mockAnalyticsData });
    await act(async () => {
        render(<BusinessAnalytics businessId={businessId} />);
    });

    await waitFor(() => {
      expect(screen.getAllByText('This Week').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Last Week').length).toBeGreaterThan(0);
    });
  });
});
