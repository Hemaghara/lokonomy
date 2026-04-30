import { render, screen, fireEvent, act } from '../../../utils/test-utils';
import AdminErrorBoundary from '../../admin/AdminErrorBoundary';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('AdminErrorBoundary Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders children when no error occurs', () => {
    render(
      <AdminErrorBoundary>
        <div data-testid="child">Child Content</div>
      </AdminErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders error UI when a child throws an error', () => {
    // In React 18+, we need to suppress the error from failing the test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <AdminErrorBoundary>
        <ThrowError />
      </AdminErrorBoundary>
    );

    expect(screen.getByText(/Return to Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Crash/i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('calls handleReset and redirects on button click', () => {
    const originalLocation = window.location;
    // Use a proxy or just a simple object that mimics URL/Location
    const locationMock = {
      href: 'http://localhost/',
      pathname: '/',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      toString: () => 'http://localhost/',
    };
    
    vi.stubGlobal('location', locationMock);

    render(
      <AdminErrorBoundary>
        <ThrowError />
      </AdminErrorBoundary>
    );

    const resetButton = screen.getByRole('button', { name: /Return to Dashboard/i });
    fireEvent.click(resetButton);

    expect(locationMock.href).toBe('/admin/dashboard');
  });
});
