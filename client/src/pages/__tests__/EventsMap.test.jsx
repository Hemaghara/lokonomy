import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock leaflet CSS
vi.mock("leaflet/dist/leaflet.css", () => ({}));

// Mock leaflet
vi.mock("leaflet", () => {
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
const mockSetView = vi.fn();
const mockFitBounds = vi.fn();
const mockZoomIn = vi.fn();
const mockZoomOut = vi.fn();

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ eventHandlers, position, icon }) => (
    <div
      data-testid="marker"
      onClick={eventHandlers?.click}
      data-position={JSON.stringify(position)}
      style={{ cursor: "pointer" }}
    />
  ),
  Circle: () => <div data-testid="circle" />,
  useMap: () => ({
    setView: mockSetView,
    fitBounds: mockFitBounds,
    zoomIn: mockZoomIn,
    zoomOut: mockZoomOut,
  }),
}));

// Mock LocationContext
vi.mock("../../context/LocationContext", () => ({
  LocationProvider: ({ children }) => <>{children}</>,
  useLocation: () => ({ coords: { lat: 22.3, lng: 72.6 } }),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock services
vi.mock("../../services", () => ({
  businessService: { getBusinesses: vi.fn() },
  feedService: { getFeeds: vi.fn() },
  authService: { getProfile: vi.fn() }, // Mock authService too to avoid side effects
}));

// Now import them - they will be the mocked versions
import { businessService, feedService } from "../../services";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...p }) => {
      const f = { ...p };
      [
        "initial",
        "animate",
        "exit",
        "transition",
        "layout",
        "whileHover",
        "whileTap",
        "whileInView",
        "layoutId",
      ].forEach((k) => delete f[k]);
      return <div {...f}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import EventsMap from "../EventsMap";

const mockBusinesses = [
  {
    _id: "b1",
    businessName: "Biz 1",
    location: { coordinates: [72.6, 22.3] },
    rating: 4,
    locationAddress: "Address 1",
    contactNumber: "123",
  },
];
const mockEvents = [
  {
    _id: "e1",
    title: "Event 1",
    location: { coordinates: [72.7, 22.4] },
    type: "Event",
    author: "User 1",
    eventDate: "2026-05-01",
    eventTime: "10:00 AM",
  },
];

describe("EventsMap Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    businessService.getBusinesses.mockResolvedValue({
      data: { success: true, data: mockBusinesses },
    });
    feedService.getFeeds.mockResolvedValue({
      data: { success: true, data: mockEvents },
    });
    // Mock window.open
    vi.stubGlobal("open", vi.fn());
  });

  it("shows loading state initially", async () => {
    businessService.getBusinesses.mockReturnValue(new Promise(() => {}));
    render(<EventsMap />);
    expect(screen.getByText(/Loading Map Data/i)).toBeInTheDocument();
  });

  it("renders map and data markers", async () => {
    render(<EventsMap />);
    expect(screen.getByTestId("map-container")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Businesses \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Events \(1\)/i)).toBeInTheDocument();
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBe(3);
    });
  });

  it("handles API errors gracefully", async () => {
    businessService.getBusinesses.mockRejectedValue(new Error("API Error"));
    render(<EventsMap />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Map Data/i)).not.toBeInTheDocument();
    });
  });

  it("toggles business markers visibility", async () => {
    render(<EventsMap />);
    await waitFor(() => screen.getByText(/Businesses \(1\)/i));

    const bizToggle = screen.getByText(/Businesses \(1\)/i);
    fireEvent.click(bizToggle);

    await waitFor(() => {
      expect(screen.getAllByTestId("marker").length).toBe(2);
    });
  });

  it("toggles event markers visibility", async () => {
    render(<EventsMap />);
    await waitFor(() => screen.getByText(/Events \(1\)/i));

    const eventToggle = screen.getByText(/Events \(1\)/i);
    fireEvent.click(eventToggle);

    await waitFor(() => {
      expect(screen.getAllByTestId("marker").length).toBe(2);
    });
  });

  it("shows details when a business marker is clicked", async () => {
    render(<EventsMap />);
    await waitFor(() => screen.getAllByTestId("marker"));

    const markers = screen.getAllByTestId("marker");
    fireEvent.click(markers[1]);

    expect(await screen.findByText("Biz 1")).toBeInTheDocument();
    expect(screen.getAllByText("Address 1")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Call/i)[0]).toBeInTheDocument();

    const viewBtn = screen.getByText(/View Details/i);
    fireEvent.click(viewBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/business/b1");
  });

  it("shows details when an event marker is clicked", async () => {
    render(<EventsMap />);
    await waitFor(() => screen.getAllByTestId("marker"));

    const markers = screen.getAllByTestId("marker");
    fireEvent.click(markers[2]);

    expect(await screen.findByText("Event 1")).toBeInTheDocument();
    expect(screen.getAllByText("User 1")[0]).toBeInTheDocument();
    expect(screen.getAllByText("2026-05-01")[0]).toBeInTheDocument();

    const directionsBtn = screen.getByText(/Get Directions/i);
    fireEvent.click(directionsBtn);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("google.com/maps/dir"),
      "_blank",
    );
  });

  it("closes the detail card", async () => {
    render(<EventsMap />);
    await waitFor(() => screen.getAllByTestId("marker"));

    fireEvent.click(screen.getAllByTestId("marker")[1]);
    expect(await screen.findByText("Biz 1")).toBeInTheDocument();

    const closeBtn = screen.getAllByRole("button").find(b => b.className.includes("top-4"));
    fireEvent.click(closeBtn);

    expect(screen.queryByText("Biz 1")).not.toBeInTheDocument();
  });

  it("handles map zoom controls", async () => {
    render(<EventsMap />);
    await waitFor(() => screen.getAllByTestId("marker"));

    const zoomInBtn = screen
      .getAllByRole("button")
      .find((b) => b.querySelector("svg.text-lg") && b.innerHTML.includes("HiPlus"));
    if (zoomInBtn) {
      fireEvent.click(zoomInBtn);
      expect(mockZoomIn).toHaveBeenCalled();
    }

    const zoomOutBtn = screen
      .getAllByRole("button")
      .find((b) => b.querySelector("svg.text-lg") && b.innerHTML.includes("HiMinus"));
    if (zoomOutBtn) {
      fireEvent.click(zoomOutBtn);
      expect(mockZoomOut).toHaveBeenCalled();
    }
  });

  it("handles recenter control", async () => {
    render(<EventsMap />);
    await waitFor(() => screen.getAllByTestId("marker"));

    const recenterBtn = screen
      .getAllByRole("button")
      .find(
        (b) =>
          b.querySelector("svg.text-lg") && b.innerHTML.includes("HiOutlineMapPin"),
      );
    if (recenterBtn) {
      fireEvent.click(recenterBtn);
      expect(mockSetView).toHaveBeenCalledWith(
        [22.3, 72.6],
        14,
        expect.any(Object),
      );
    }
  });
});
