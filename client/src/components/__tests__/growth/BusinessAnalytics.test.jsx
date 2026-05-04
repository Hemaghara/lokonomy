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

  it('shows loading state initially', async () => {
    // delay resolution to see loading state
    let resolvePromise;
    const promise = new Promise((resolve) => { resolvePromise = resolve; });
    growthService.getAnalytics.mockReturnValue(promise);
    
    render(<BusinessAnalytics businessId={businessId} />);
    
    expect(screen.getByText('Loading analytics…')).toBeInTheDocument();
    
    // Cleanup
    resolvePromise({ data: mockAnalyticsData });
    await waitFor(() => expect(screen.queryByText('Loading analytics…')).not.toBeInTheDocument());
  });

  it('handles general errors gracefully (non-403)', async () => {
    growthService.getAnalytics.mockRejectedValue(new Error('Network error'));
    await act(async () => {
        render(<BusinessAnalytics businessId={businessId} />);
    });
    
    await waitFor(() => {
      // It should still render the dashboard but with 0 values
      expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
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

  it('toggles between Area and Bar charts', async () => {
    growthService.getAnalytics.mockResolvedValue({ data: mockAnalyticsData });
    await act(async () => {
        render(<BusinessAnalytics businessId={businessId} />);
    });

    await waitFor(() => expect(screen.getByText('Analytics Overview')).toBeInTheDocument());

    const barBtn = screen.getByText('Bar');
    const areaBtn = screen.getByText('Area');

    // Default is Area, so Area button should have active styles
    expect(areaBtn).toHaveClass('bg-indigo-600');
    expect(barBtn).not.toHaveClass('bg-indigo-600');

    await act(async () => {
      fireEvent.click(barBtn);
    });

    expect(barBtn).toHaveClass('bg-indigo-600');
    expect(areaBtn).not.toHaveClass('bg-indigo-600');
  });

  it('displays negative growth smart insight correctly', async () => {
    const decreasingData = {
      visits: 500,
      dailyVisits: [
        // Last week higher (100)
        { date: '2023-10-01', count: 100 }, { date: '2023-10-02', count: 0 }, { date: '2023-10-03', count: 0 }, { date: '2023-10-04', count: 0 }, { date: '2023-10-05', count: 0 }, { date: '2023-10-06', count: 0 }, { date: '2023-10-07', count: 0 },
        // This week lower (50)
        { date: '2023-10-08', count: 50 }, { date: '2023-10-09', count: 0 }, { date: '2023-10-10', count: 0 }, { date: '2023-10-11', count: 0 }, { date: '2023-10-12', count: 0 }, { date: '2023-10-13', count: 0 }, { date: '2023-10-14', count: 0 },
      ]
    };
    growthService.getAnalytics.mockResolvedValue({ data: decreasingData });
    
    await act(async () => {
        render(<BusinessAnalytics businessId={businessId} />);
    });

    await waitFor(() => {
      // Growth should be -50%
      expect(screen.getByText('-50%')).toBeInTheDocument();
      expect(screen.getByText(/Visits dropped 50% this week/i)).toBeInTheDocument();
    });
  });

  it('handles empty data arrays without crashing', async () => {
    growthService.getAnalytics.mockResolvedValue({ data: { visits: 0, dailyVisits: [] } });
    
    await act(async () => {
        render(<BusinessAnalytics businessId={businessId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
      // Total Visitors, This Week, Growth, Average, Peak Day should all be 0 or 0%
      const zeros = screen.getAllByText('0', { selector: '.text-2xl' });
      expect(zeros.length).toBeGreaterThan(0);
    });
  });

  it('handles less than 14 days of data', async () => {
    const shortData = {
      visits: 50,
      dailyVisits: [
        { date: '2023-10-01', count: 20 },
        { date: '2023-10-02', count: 30 }
      ]
    };
    growthService.getAnalytics.mockResolvedValue({ data: shortData });
    
    await act(async () => {
        render(<BusinessAnalytics businessId={businessId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
      // This week should be 50, Total Visitors is 50. So multiple '50's.
      const fifties = screen.getAllByText('50', { selector: '.text-2xl' });
      expect(fifties.length).toBeGreaterThan(0);
    });
  });
});
