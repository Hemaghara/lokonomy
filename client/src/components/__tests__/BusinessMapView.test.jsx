import { render } from '../../utils/test-utils';
import BusinessMapView from '../BusinessMapView';
import { describe, it, expect, vi } from 'vitest';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: () => <div data-testid="marker" />,
  Circle: () => <div data-testid="circle" />,
  useMap: () => ({ setView: vi.fn(), fitBounds: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn() })
}));

describe('BusinessMapView Component', () => {
  const mockBusinesses = [
    { _id: '1', businessName: 'Biz 1', location: { coordinates: [72, 22] } }
  ];

  it('renders without crashing', () => {
    const { getByTestId } = render(<BusinessMapView businesses={[]} />);
    expect(getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders markers for valid businesses', () => {
    const { getAllByTestId } = render(<BusinessMapView businesses={mockBusinesses} />);
    expect(getAllByTestId('marker').length).toBeGreaterThan(0);
  });
});
