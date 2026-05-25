import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import BusinessDetails from "../BusinessDetails";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { businessService } from "../../services";
import recommendationService from "../../services/recommendationService";
import { toast } from "react-hot-toast";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "biz-1" }),
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  };
});

// Mock recommendationService directly
vi.mock("../../services/recommendationService", () => ({
  __esModule: true,
  default: {
    trackInteraction: vi.fn().mockResolvedValue({ data: { success: true } }),
    trackView: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

// Mock services barrel
vi.mock("../../services", () => ({
  businessService: {
    getBusinessById: vi.fn().mockResolvedValue({
      data: {
        _id: "biz-1",
        businessName: "Premium Spa",
        ownerName: "Alice",
        ownerId: "owner-1",
        description: "Luxury treatments",
        rating: 4.5,
        reviews: [
          {
            userId: "user-2",
            userName: "Bob",
            rating: 5,
            comment: "Great!",
            createdAt: new Date().toISOString(),
          },
        ],
        mainCategory: "Wellness",
        subCategory: "Spa",
        locationAddress: "123 Zen Lane",
        verified: true,
        contactNumber: "1234567890",
        businessHours: {
          Monday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
        },
        location: { coordinates: [77.12, 28.61] }, // [long, lat]
        photos: ["photo1.jpg", "photo2.jpg"],
        website: "https://spa.com",
      },
    }),
    incrementVisits: vi.fn(),
    addReview: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
  storyService: {
    getHighlights: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
  wishlistService: {
    checkWishlistStatus: vi.fn().mockResolvedValue({ data: { isWishlisted: false } }),
    getWishlist: vi.fn().mockResolvedValue({ data: [] }),
    toggleWishlist: vi.fn().mockResolvedValue({ data: { isWishlisted: false } }),
  },
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock Leaflet
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
}));

describe("BusinessDetails Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders business details correctly", async () => {
    render(<BusinessDetails />);

    await waitFor(() => {
      expect(screen.getAllByText("Premium Spa")[0]).toBeDefined();
      expect(screen.getByText(/Luxury treatments/i)).toBeDefined();
      expect(screen.getAllByText("Verified")[0]).toBeDefined();
      expect(screen.getAllByText("4.5")[0]).toBeDefined();
    });

    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getAllByText("123 Zen Lane")[0]).toBeDefined();
  });

  it("switches tabs and displays reviews", async () => {
    render(<BusinessDetails />);

    await waitFor(() => screen.getAllByText("Premium Spa")[0]);

    const reviewsTab = screen.getByRole("button", { name: /Reviews/i });
    fireEvent.click(reviewsTab);

    await waitFor(() => {
      expect(screen.getAllByText("Bob")[0]).toBeDefined();
      expect(screen.getAllByText("Great!")[0]).toBeDefined();
    });
  });

  it('submits a review successfully', async () => {
    localStorage.setItem('lokonomy_user', JSON.stringify({ id: 'user-1', name: 'John' }));
    render(<BusinessDetails />);
    
    await waitFor(() => screen.getAllByText('Premium Spa')[0]);

    fireEvent.click(screen.getByRole("button", { name: /Reviews/i }));

    const commentInput = screen.getByPlaceholderText(/Share your experience/i);
    fireEvent.change(commentInput, { target: { value: "Excellent service" } });

    const submitBtn = screen.getByRole("button", { name: /Submit Review/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(businessService.addReview).toHaveBeenCalledWith(
        "biz-1",
        expect.objectContaining({
          comment: "Excellent service",
          userName: "John",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Review submitted successfully",
      );
    });
  });

  it('prevents owner from reviewing their own business', async () => {
    localStorage.setItem('lokonomy_user', JSON.stringify({ id: 'owner-1', name: 'Alice' }));
    render(<BusinessDetails />);
    
    await waitFor(() => screen.getAllByText('Premium Spa')[0]);

    fireEvent.click(screen.getByRole("button", { name: /Reviews/i }));

    expect(screen.getByText(/Owners cannot leave reviews/i)).toBeDefined();
  });

  it("tracks interaction and increments visits", async () => {
    localStorage.setItem('lokonomy_user', JSON.stringify({ id: 'user-1' }));
    render(<BusinessDetails />);

    await waitFor(() => {
      expect(recommendationService.trackInteraction).toHaveBeenCalledWith(
        "view",
        "business",
        "biz-1",
      );
      expect(businessService.incrementVisits).toHaveBeenCalledWith("biz-1");
    });
  });

  it('shows owner tools only for business owner', async () => {
    localStorage.setItem('lokonomy_user', JSON.stringify({ id: 'user-1' }));
    const { unmount } = render(<BusinessDetails />);
    await waitFor(() => screen.getAllByText('Premium Spa')[0]);
    expect(screen.queryByText(/Growth Tools/i)).toBeNull();

    unmount();
    localStorage.setItem('lokonomy_user', JSON.stringify({ id: 'owner-1' }));
    render(<BusinessDetails />);
    await waitFor(() => {
      expect(screen.getByText(/Growth Tools/i)).toBeDefined();
    });
  });

  it('handles "Call Now" click', async () => {
    render(<BusinessDetails />);
    await waitFor(() => screen.getAllByText("Premium Spa")[0]);

    const callBtn = screen.getByRole("link", { name: /Call Now/i });
    expect(callBtn.getAttribute("href")).toBe("tel:1234567890");
  });

  it("opens Google Maps when location button clicked", async () => {
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => {});
    render(<BusinessDetails />);
    await waitFor(() => screen.getAllByText("Premium Spa")[0]);

    const mapsBtn = screen.getByRole("button", {
      name: /Open in Google Maps/i,
    });
    fireEvent.click(mapsBtn);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining("google.com/maps"),
    );
  });

  it("handles gallery images correctly", async () => {
    render(<BusinessDetails />);
    await waitFor(() => screen.getAllByText("Premium Spa")[0]);

    fireEvent.click(screen.getByRole("button", { name: /Gallery/i }));

    await waitFor(() => {
      const images = screen.getAllByRole("img");
      const galleryImages = images.filter((img) =>
        img.getAttribute("src")?.includes("photo"),
      );
      expect(galleryImages.length).toBeGreaterThanOrEqual(2);
    });
  });
});
