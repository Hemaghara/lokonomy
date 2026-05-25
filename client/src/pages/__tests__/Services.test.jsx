import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import Services from "../Services";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { businessService } from "../../services";

// Mock businessService
vi.mock("../../services", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    businessService: {
      ...actual.businessService,
      getBusinesses: vi.fn().mockResolvedValue({
        data: [
          {
            _id: "b1",
            businessName: "Premium Spa",
            subCategory: "Beauty",
            rating: 4.8,
            locationAddress: "Downtown",
            logo: "spa.jpg",
            description: "Relaxing spa services.",
          },
          {
            _id: "b2",
            businessName: "Local Salon",
            subCategory: "Hair",
            rating: 4.2,
            locationAddress: "Uptown",
          },
        ],
      }),
    },
    wishlistService: {
      ...actual.wishlistService,
      checkWishlistStatus: vi.fn().mockResolvedValue({ success: true, isSaved: false }),
    },
  };
});

// Mock BusinessMapView
vi.mock("../../components/BusinessMapView", () => ({
  default: () => <div data-testid="mock-map">Mock Map View</div>,
}));

// Mock ComparisonContext
vi.mock("../../context/ComparisonContext", () => ({
  useComparison: () => ({
    selectedIds: [],
    toggleSelection: vi.fn(),
  }),
}));

describe("Services Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("renders services and category header", async () => {
    render(<Services />);

    await waitFor(() => {
      expect(screen.getAllByText("Premium Spa")[0]).toBeDefined();
      expect(screen.getAllByText("Local Salon")[0]).toBeDefined();
    });
  });

  it("renders breadcrumbs correctly", () => {
    render(<Services />);
    expect(screen.getByText("Directory")).toBeDefined();
    expect(screen.getByText("Browse All")).toBeDefined();
  });

  it("filters results based on search query", async () => {
    render(<Services />);

    await waitFor(() => screen.getAllByText("Premium Spa")[0]);

    const searchInput = screen.getByPlaceholderText(/Search by name/i);
    fireEvent.change(searchInput, { target: { value: "Premium" } });

    expect(screen.getAllByText("Premium Spa")[0]).toBeDefined();
    expect(screen.queryByText("Local Salon")).toBeNull();
  });

  it("toggles between list and map view", async () => {
    render(<Services />);

    await waitFor(() => screen.getAllByText("Premium Spa")[0]);

    const mapBtn = screen.getByRole("button", { name: /Map/i });
    fireEvent.click(mapBtn);

    await waitFor(() => {
      expect(screen.getByTestId("mock-map")).toBeDefined();
    });
  });

  it("handles geolocation success and radius selection", async () => {
    const coords = { latitude: 23.0, longitude: 72.5 };
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: vi
          .fn()
          .mockImplementationOnce((success) => success({ coords })),
      },
      configurable: true,
    });

    render(<Services />);

    await waitFor(() => {
      expect(screen.getByText(/within/i)).toBeDefined();
    });

    const tenKmBtn = screen.getByRole("button", { name: "10 km" });
    fireEvent.click(tenKmBtn);

    expect(businessService.getBusinesses).toHaveBeenCalledWith(
      expect.objectContaining({
        radius: 10000,
        lat: 23.0,
        lng: 72.5,
      }),
    );
  });

  it("handles geolocation denial gracefully", async () => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: vi.fn().mockImplementationOnce((success, error) =>
          error({
            code: 1,
            message: "User denied Geolocation",
          }),
        ),
      },
      configurable: true,
    });

    render(<Services />);
    screen.debug();
    await screen.findByText(/Location access denied/i);
  });

  it("shows empty state and expand radius button", async () => {
    // Mock ALL calls to return empty (sortBy change from coords triggers a second fetch)
    businessService.getBusinesses.mockResolvedValue({ data: [] });

    // Set coords to show "Expand Radius"
    sessionStorage.setItem(
      "lokonomy_user_coords",
      JSON.stringify({ lat: 23, lng: 72 }),
    );

    render(<Services />);

    await waitFor(() => {
      expect(screen.getByText(/No businesses nearby/i)).toBeDefined();
      expect(screen.getByText(/Expand Radius/i)).toBeDefined();
    });

    fireEvent.click(screen.getByText(/Expand Radius/i));
    expect(businessService.getBusinesses).toHaveBeenCalled();

    sessionStorage.removeItem("lokonomy_user_coords");
    // Restore default mock for subsequent tests
    businessService.getBusinesses.mockResolvedValue({
      data: [
        {
          _id: "b1",
          businessName: "Premium Spa",
          subCategory: "Beauty",
          rating: 4.8,
          locationAddress: "Downtown",
          logo: "spa.jpg",
          description: "Relaxing spa services.",
        },
        {
          _id: "b2",
          businessName: "Local Salon",
          subCategory: "Hair",
          rating: 4.2,
          locationAddress: "Uptown",
        },
      ],
    });
  });

  it("handles comparison mode selection", async () => {
    render(<Services />);

    await waitFor(() => screen.getAllByText("Premium Spa")[0]);

    const compareBtn = screen.getByRole("button", { name: /Compare Mode/i });
    fireEvent.click(compareBtn);

    const selectBtn = screen.getAllByText(/\+ Add to Compare/i)[0];
    fireEvent.click(selectBtn);
    // toggleSelection is called from context (mocked)
  });

  it("handles API errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    businessService.getBusinesses.mockRejectedValueOnce(
      new Error("Fetch Failed"),
    );

    render(<Services />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching services:",
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });
});
