import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "../../utils/test-utils";
import MapPicker from "../MapPicker";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock react-leaflet
vi.mock("react-leaflet", () => {
  return {
    MapContainer: ({ children }) => (
      <div data-testid="map-container">{children}</div>
    ),
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ position }) => (
      <div data-testid="marker" data-lat={position[0]} data-lng={position[1]} />
    ),
    useMapEvents: vi.fn(),
  };
});

// We need to mock ClickHandler since useMapEvents is inside it
vi.mock("leaflet", () => {
  const Icon = vi.fn();
  Icon.Default = {
    prototype: { _getIconUrl: vi.fn() },
    mergeOptions: vi.fn(),
  };
  return {
    default: { Icon },
    Icon,
  };
});

// Since the component has a reverseGeocode function making fetch calls
global.fetch = vi.fn();

describe("MapPicker Component", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
    };
  });

  it("renders with initial state (no value)", () => {
    render(<MapPicker onChange={mockOnChange} />);
    expect(
      screen.getByText("Click on the map to pin your shop location"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });

  it("renders with initial value", () => {
    const value = { lat: 23.0225, lng: 72.5714, address: "Ahmedabad, Gujarat" };
    render(<MapPicker value={value} onChange={mockOnChange} />);

    expect(screen.getByText("Ahmedabad, Gujarat")).toBeInTheDocument();
    expect(screen.getByTestId("marker")).toBeInTheDocument();
    expect(screen.getByText("LAT 23.022500")).toBeInTheDocument();
    expect(screen.getByText("LNG 72.571400")).toBeInTheDocument();
  });

  it("clears pin when clear button is clicked", () => {
    const value = { lat: 23.0225, lng: 72.5714 };
    render(<MapPicker value={value} onChange={mockOnChange} />);

    const clearBtn = screen.getByText("✕ Clear pin");
    fireEvent.click(clearBtn);

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it("uses GPS and calls reverse geocoding on success", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi
        .fn()
        .mockImplementation((success) =>
          success({ coords: { latitude: 22.3, longitude: 72.6 } }),
        ),
    };
    global.navigator.geolocation = mockGeolocation;

    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        display_name: "Test Address, City, State, Country",
        address: {
          postcode: "12345",
          state: "TestState",
          city: "TestCity",
          suburb: "TestTaluka",
        },
      }),
    });

    render(<MapPicker onChange={mockOnChange} />);

    const gpsBtn = screen.getByText("Use My GPS").closest("button");

    await act(async () => {
      fireEvent.click(gpsBtn);
    });

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("lat=22.3&lon=72.6"),
    );

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        lat: 22.3,
        lng: 72.6,
        address: "Test Address, City, State, Country",
        pincode: "12345",
        state: "TestState",
        district: "TestCity",
        taluka: "TestTaluka",
      });
    });
  });

  it("handles GPS failure gracefully", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi
        .fn()
        .mockImplementation((success, error) => error(new Error("GPS Denied"))),
    };
    global.navigator.geolocation = mockGeolocation;

    render(<MapPicker onChange={mockOnChange} />);

    const gpsBtn = screen.getByText("Use My GPS").closest("button");
    fireEvent.click(gpsBtn);

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();

    // Should not call onChange
    await waitFor(() => {
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    // GPS button should no longer show "Locating..."
    expect(screen.getByText("Use My GPS")).toBeInTheDocument();
  });

  it("falls back if reverse geocoding fetch fails", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi
        .fn()
        .mockImplementation((success) =>
          success({ coords: { latitude: 22.3, longitude: 72.6 } }),
        ),
    };
    global.navigator.geolocation = mockGeolocation;

    global.fetch.mockRejectedValueOnce(new Error("Network error"));

    render(<MapPicker onChange={mockOnChange} />);

    const gpsBtn = screen.getByText("Use My GPS").closest("button");

    await act(async () => {
      fireEvent.click(gpsBtn);
    });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        lat: 22.3,
        lng: 72.6,
        address: "22.30000, 72.60000",
        pincode: "",
        state: "Gujarat",
        district: "",
        taluka: "",
      });
    });
  });
});
