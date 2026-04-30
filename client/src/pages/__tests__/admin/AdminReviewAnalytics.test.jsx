import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import AdminReviewAnalytics from '../../admin/AdminReviewAnalytics';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../../services';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ businessId: 'b1' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock adminService
vi.mock('../../../services', () => ({
  adminService: {
    getBusinessReviewAnalytics: vi.fn().mockResolvedValue({
      data: {
        businessName: 'Test Business',
        averageRating: 4.5,
        totalReviews: 120,
        ratingDistribution: {
          5: 80,
          4: 25,
          3: 10,
          2: 3,
          1: 2
        }
      }
    })
  }
}));

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Cell: () => null,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
}));

// Mock html2pdf.js
vi.mock('html2pdf.js', () => ({
  default: () => ({
    set: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    save: vi.fn().mockResolvedValue({}),
  }),
}));

describe('AdminReviewAnalytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders analytics dashboard correctly', async () => {
    render(<AdminReviewAnalytics />);
    
    expect(await screen.findByText(/Test Business/i)).toBeDefined();
    expect(screen.getAllByText(/Analytics/i)[0]).toBeDefined();
    expect(screen.getAllByText('4.5')[0]).toBeDefined();
    expect(screen.getAllByText('120')[0]).toBeDefined();
    expect(screen.getAllByText(/Positive/i)[0]).toBeDefined();
    expect(screen.getByTestId('bar-chart')).toBeDefined();
    expect(screen.getByTestId('pie-chart')).toBeDefined();
  });

  it('opens report modal and handles download', async () => {
    render(<AdminReviewAnalytics />);
    
    await screen.findByText(/Test Business/i);

    const generateBtn = await screen.findByRole('button', { name: /Generate Full Report/i });
    fireEvent.click(generateBtn);

    expect(await screen.findByText(/Executive Review Report/i)).toBeDefined();
    expect(screen.getAllByText(/Platform Authenticity Verified/i)[0]).toBeDefined();
    expect(screen.getAllByText(/Exceptional performance/i)[0]).toBeDefined();

    const downloadBtn = screen.getAllByRole('button', { name: /Download Executive Report/i })[0];
    fireEvent.click(downloadBtn);
  });

  it('handles navigation back to reviews', async () => {
    render(<AdminReviewAnalytics />);
    
    const backBtn = await screen.findByText(/Back to Management/i);
    fireEvent.click(backBtn);
  });
});

