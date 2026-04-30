import { render, screen, fireEvent, waitFor, act } from '../../utils/test-utils';
import MapPicker from '../MapPicker';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

const mockFlyTo = vi.fn();
const mockUseMapEvents = vi.fn();

vi.mock('react-leaflet', async () => {
  const React = await import('react');
  return {
    MapContainer: React.forwardRef(({ children }, ref) => {
      React.useImperativeHandle(ref, () => ({
        // Using global variable trick because variables inside vi.mock cannot be accessed easily unless hoisted
        flyTo: (...args) => global.__mockFlyTo(...args),
      }));
      return <div data-testid="map-container">{children}</div>;
    }),
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: () => <div data-testid="marker" />,
    useMapEvents: (handlers) => {
      global.__mockUseMapEvents(handlers);
      return null;
    }
  };
});

describe('MapPicker Component', () => {
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    
    global.__mockFlyTo = mockFlyTo;
    global.__mockUseMapEvents = mockUseMapEvents;

    // Reset navigator.geolocation for each test
    Object.assign(navigator, {
      geolocation: {
        getCurrentPosition: vi.fn()
      }
    });
  });

  afterEach(() => {
    Object.assign(navigator, {
      geolocation: originalGeolocation
    });
    delete global.__mockFlyTo;
    delete global.__mockUseMapEvents;
  });

  it('renders correctly without value', () => {
    render(<MapPicker onChange={vi.fn()} />);
    expect(screen.getByText('Click on the map to pin your shop location')).toBeInTheDocument();
  });

  it('renders correctly with value', () => {
    render(<MapPicker value={{ lat: 10, lng: 20, address: 'Test Address' }} onChange={vi.fn()} />);
    expect(screen.getByText(/Test Address/)).toBeInTheDocument();
    expect(screen.getByText(/Clear pin/)).toBeInTheDocument();
    expect(screen.getByText(/LAT 10.000000/)).toBeInTheDocument();
    expect(screen.getByText(/LNG 20.000000/)).toBeInTheDocument();
  });

  it('calls onChange when Clear pin is clicked', () => {
    const onChange = vi.fn();
    render(<MapPicker value={{ lat: 10, lng: 20 }} onChange={onChange} />);
    
    fireEvent.click(screen.getByText(/Clear pin/));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('handles GPS button click and reverse geocodes successfully', async () => {
    const onChange = vi.fn();
    navigator.geolocation.getCurrentPosition.mockImplementation((success) => 
      success({ coords: { latitude: 10, longitude: 20 } })
    );
    
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        display_name: 'Loc, City, District, State',
        address: {
          state: 'Test State',
          city: 'Test City',
          postcode: '123456'
        }
      })
    });

    render(<MapPicker onChange={onChange} />);
    
    const gpsBtn = screen.getByText(/Use My GPS/);
    fireEvent.click(gpsBtn);
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        lat: 10,
        lng: 20,
        address: 'Loc, City, District, State',
        pincode: '123456',
        state: 'Test State',
        district: 'Test City',
        taluka: ''
      });
      expect(mockFlyTo).toHaveBeenCalledWith([10, 20], 16, { duration: 1.2 });
    });
  });

  it('handles GPS geolocation failure', async () => {
    const onChange = vi.fn();
    navigator.geolocation.getCurrentPosition.mockImplementation((success, error) => 
      error(new Error('Geolocation failed'))
    );

    render(<MapPicker onChange={onChange} />);
    
    fireEvent.click(screen.getByText(/Use My GPS/));
    
    // Wait for the button to reset from loading state
    await waitFor(() => {
      expect(screen.getByText(/Use My GPS/)).toBeInTheDocument();
      expect(screen.queryByText(/Locating/)).not.toBeInTheDocument();
    });
    
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does nothing when GPS button clicked but geolocation is not supported', async () => {
    const onChange = vi.fn();
    // Remove geolocation
    Object.assign(navigator, { geolocation: undefined });

    render(<MapPicker onChange={onChange} />);
    
    fireEvent.click(screen.getByText(/Use My GPS/));
    
    expect(onChange).not.toHaveBeenCalled();
  });

  it('handles map click and reverse geocodes successfully', async () => {
    const onChange = vi.fn();
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        display_name: 'Loc, Town, Dist, State',
        address: {
          county: 'Dist',
          village: 'Town',
          state: 'State'
        }
      })
    });

    render(<MapPicker onChange={onChange} />);
    
    // Simulate map click by calling the registered event handler
    const handlers = mockUseMapEvents.mock.calls[0][0];
    act(() => {
      handlers.click({ latlng: { lat: 15, lng: 25 } });
    });

    // Expect loading indicator to show (might need to wait a tiny bit or just skip if too fast)
    await waitFor(() => {
      expect(screen.getByText(/Getting address/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        lat: 15,
        lng: 25,
        address: 'Loc, Town, Dist, State',
        pincode: '',
        state: 'State',
        district: 'Dist',
        taluka: 'Town'
      });
    });
  });

  it('handles geocoding fetch failure gracefully', async () => {
    const onChange = vi.fn();
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<MapPicker onChange={onChange} />);
    
    const handlers = mockUseMapEvents.mock.calls[0][0];
    act(() => {
      handlers.click({ latlng: { lat: 15, lng: 25 } });
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        lat: 15,
        lng: 25,
        address: '15.00000, 25.00000',
        pincode: '',
        state: 'Gujarat',
        district: '',
        taluka: ''
      });
    });
  });

  it('handles geocoding response without display_name', async () => {
    const onChange = vi.fn();
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        error: 'Unable to geocode'
      })
    });

    render(<MapPicker onChange={onChange} />);
    
    const handlers = mockUseMapEvents.mock.calls[0][0];
    act(() => {
      handlers.click({ latlng: { lat: 15.12345, lng: 25.12345 } });
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        lat: 15.12345,
        lng: 25.12345,
        address: '15.12345, 25.12345',
        pincode: '',
        state: 'Gujarat',
        district: '',
        taluka: ''
      });
    });
  });
});
