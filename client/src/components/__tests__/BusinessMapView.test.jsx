import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import BusinessMapView from "../BusinessMapView";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockZoomIn = vi.fn();
const mockZoomOut = vi.fn();
const mockSetView = vi.fn();
const mockFitBounds = vi.fn();

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ eventHandlers, icon }) => (
    <div data-testid="marker" onClick={eventHandlers?.click}>
      Marker
    </div>
  ),
  Circle: () => <div data-testid="circle" />,
  useMap: () => ({
    setView: mockSetView,
    fitBounds: mockFitBounds,
    zoomIn: mockZoomIn,
    zoomOut: mockZoomOut,
  }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("BusinessMapView Component", () => {
  const mockBusinesses = [
    {
      _id: "1",
      businessName: "Biz 1",
      subCategory: "Tech",
      location: { coordinates: [72.1, 22.1] },
      rating: 4.5,
      contactNumber: "1234567890",
    },
    {
      _id: "2",
      businessName: "Biz 2",
      location: { coordinates: [] }, // Invalid coordinates
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing and shows empty state when no pins", () => {
    render(<BusinessMapView businesses={[]} />);
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByText("No Pins Found")).toBeInTheDocument();
  });

  it("renders markers for valid businesses and ignores invalid ones", () => {
    render(<BusinessMapView businesses={mockBusinesses} />);
    const markers = screen.getAllByTestId("marker");
    expect(markers.length).toBe(1); // Only Biz 1 has valid coords
  });

  it("handles map controls (zoom in, zoom out, recenter)", () => {
    render(
      <BusinessMapView businesses={[]} userCoords={{ lat: 22, lng: 72 }} />,
    );

    fireEvent.click(screen.getByTitle("Zoom In"));
    expect(mockZoomIn).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle("Zoom Out"));
    expect(mockZoomOut).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle("Recenter Map"));
    expect(mockSetView).toHaveBeenCalledWith([22, 72], 14, { animate: true });
  });

  it("selects a marker and displays business details", async () => {
    render(<BusinessMapView businesses={mockBusinesses} />);

    // Click the marker
    fireEvent.click(screen.getByTestId("marker"));

    // Popup should appear with business details
    await waitFor(() => {
      expect(screen.getByText("Biz 1")).toBeInTheDocument();
      expect(screen.getByText("Tech")).toBeInTheDocument();
    });

    // Check call button
    expect(screen.getByTitle("Call Business")).toHaveAttribute(
      "href",
      "tel:1234567890",
    );

    // Click 'Explore Details'
    fireEvent.click(screen.getByText("Explore Details"));
    expect(mockNavigate).toHaveBeenCalledWith("/business/1");
  });

  it("closes the selected marker popup", async () => {
    render(<BusinessMapView businesses={mockBusinesses} />);

    // Click marker to open
    fireEvent.click(screen.getByTestId("marker"));
    await waitFor(() => expect(screen.getByText("Biz 1")).toBeInTheDocument());

    const closeBtn = document.querySelector("button.absolute.top-3.right-3");
    if (closeBtn) fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText("Biz 1")).not.toBeInTheDocument();
    });
  });
});
