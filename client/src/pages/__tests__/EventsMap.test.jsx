import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock leaflet CSS import (causes esbuild transform failure)
vi.mock('leaflet/dist/leaflet.css', () => ({}));

// Mock leaflet
vi.mock('leaflet', () => {
  const L = {
    Icon: vi.fn(),
    latLngBounds: vi.fn(() => ({
      extend: vi.fn(),
      pad: vi.fn().mockReturnValue({}),
    })),
  };
  return { ...L, default: L };
});

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ eventHandlers }) => (
    <div data-testid="marker" onClick={eventHandlers?.click} style={{ cursor: 'pointer' }} />
  ),
  Circle: () => <div data-testid="circle" />,
  useMap: () => ({ setView: vi.fn(), fitBounds: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn() }),
}));

// Mock LocationContext
vi.mock('../../context/LocationContext', () => ({
  LocationProvider: ({ children }) => <div data-testid="location-provider">{children}</div>,
  useLocation: () => ({ coords: { lat: 22.3, lng: 72.6 } }),
}));

// Mock services
vi.mock('../../services', () => ({
  businessService: {
    getBusinesses: vi.fn().mockResolvedValue({
      data: { success: true, data: [{ _id: 'b1', businessName: 'Biz 1', location: { coordinates: [72.6, 22.3] }, rating: 4 }] }
    }),
  },
  feedService: {
    getFeeds: vi.fn().mockResolvedValue({
      data: { success: true, data: [{ _id: 'e1', title: 'Event 1', location: { coordinates: [72.7, 22.4] }, type: 'Event' }] }
    }),
  }
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }) => { const f={...p};['initial','animate','exit','transition','layout','whileHover','whileTap','whileInView','layoutId'].forEach(k=>delete f[k]); return <div {...f}>{children}</div>; },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Import after all mocks
import EventsMap from '../EventsMap';

describe('EventsMap Page', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders map and initial data', async () => {
    render(<EventsMap />);
    expect(screen.getByTestId('map-container')).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText(/Businesses \(1\)/i)).toBeDefined();
      expect(screen.getByText(/Events \(1\)/i)).toBeDefined();
    });
  });

  it('filters markers by type', async () => {
    render(<EventsMap />);
    await waitFor(() => screen.getByText(/Businesses \(1\)/i));
    const eventFilter = screen.getByText(/Events \(1\)/i);
    fireEvent.click(eventFilter);
  });

  it('shows details when a marker is clicked', async () => {
    render(<EventsMap />);
    // Wait for markers to be rendered
    await waitFor(() => {
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBeGreaterThanOrEqual(2);
    });

    const markers = screen.getAllByTestId('marker');
    // markers[0] is User, markers[1] is Business, markers[2] is Event
    // Click business marker
    fireEvent.click(markers[1]);

    // Check for business details
    expect(await screen.findByText('Biz 1')).toBeInTheDocument();
    expect(screen.getByText(/View Details/i)).toBeInTheDocument();
  });
});
