import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import Home from "../Home";
import { describe, it, expect, vi, beforeEach } from "vitest";
import recommendationService from "../../services/recommendationService";
import { feedService } from "../../services";

// Mock services
vi.mock("../../services/recommendationService", () => ({
  default: {
    getRecommendations: vi.fn().mockResolvedValue({
      businesses: [
        {
          _id: "b1",
          businessName: "Local Shop",
          category: "Retail",
          images: ["b.jpg"],
          rating: 4.5,
          district: "Central",
        },
      ],
      products: [
        {
          _id: "p1",
          productName: "Handmade Soap",
          price: 200,
          productImages: ["p.jpg"],
          description: "Organic soap",
        },
      ],
      jobs: [
        {
          _id: "j1",
          position: "Software Dev",
          companyName: "Tech Co",
          type: "Full-time",
          salary: "50k",
          district: "Downtown",
        },
      ],
    }),
    trackInteraction: vi.fn(),
  },
}));

vi.mock("../../services", () => ({
  feedService: {
    getFeeds: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            _id: "e1",
            title: "Local Festival",
            type: "Event",
            createdAt: new Date(),
            eventDate: "2024-05-01",
            eventTime: "10:00 AM",
            locationAddress: "City Square",
            author: "Admin",
          },
        ],
      },
    }),
  },
}));

// Mock SmartSearch to avoid its complexity in Home tests
vi.mock("../../components/SmartSearch", () => ({
  default: () => <div data-testid="smart-search">Smart Search</div>,
}));

describe("Home Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders hero section and stats correctly", async () => {
    render(<Home />);

    expect(screen.getByText(/Empowering Your/i)).toBeInTheDocument();
    expect(screen.getByText(/Local Community/i)).toBeInTheDocument();
    expect(screen.getByTestId("smart-search")).toBeInTheDocument();

    // Check stats
    expect(screen.getByText(/Active Users/i)).toBeInTheDocument();
    expect(screen.getByText(/2k\+/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Local Businesses/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/450\+/i)).toBeInTheDocument();
  });

  it("renders recommendations and handles interaction", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Local Shop")).toBeInTheDocument();
      expect(screen.getByText("Handmade Soap")).toBeInTheDocument();
      expect(screen.getByText("Software Dev")).toBeInTheDocument();
    });

    // Click a recommendation card
    const businessCard = screen
      .getByText("Local Shop")
      .closest('div[class*="group"]');
    fireEvent.click(businessCard);

    expect(recommendationService.trackInteraction).toHaveBeenCalledWith(
      "click",
      "business",
      "b1",
    );
  });

  it("navigates to browse pages from hero buttons", () => {
    render(<Home />);

    const getStartedBtn = screen.getByRole("link", { name: /Get Started/i });
    expect(getStartedBtn).toHaveAttribute("href", "/explore");

    const marketplaceBtn = screen.getByRole("link", {
      name: /View Marketplace/i,
    });
    expect(marketplaceBtn).toHaveAttribute("href", "/market");
  });

  it("renders and navigates through categories", () => {
    render(<Home />);

    expect(screen.getByText(/Browse Categories/i)).toBeInTheDocument();

    // Categories come from data/categories.js - we check if some are rendered
    // Since we can't easily see the data, we check for the link
    const exploreAllLink = screen.getByRole("link", {
      name: /Explore All Categories/i,
    });
    expect(exploreAllLink).toHaveAttribute("href", "/explore/all");
  });

  it("renders upcoming events and navigates to events map", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Local Festival")).toBeInTheDocument();
      expect(screen.getByText("By Admin")).toBeInTheDocument();
    });

    const mapBtn = screen.getByRole("button", { name: /Open Events Map/i });
    fireEvent.click(mapBtn);
    // Navigation is handled via navigate() mock in test-utils
  });

  it("shows empty states when no data is returned", async () => {
    recommendationService.getRecommendations.mockResolvedValueOnce({
      businesses: [],
      products: [],
      jobs: [],
    });
    feedService.getFeeds.mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.queryByText("Local Shop")).not.toBeInTheDocument();
      expect(
        screen.getByText(/No events scheduled recently/i),
      ).toBeInTheDocument();
    });
  });

  it("handles service errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    recommendationService.getRecommendations.mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<Home />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch recommendations:",
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });

  it("renders CTA section with correct links", () => {
    render(<Home />);

    expect(screen.getByText(/Ready to Boost Your/i)).toBeInTheDocument();

    const registerLink = screen.getByRole("link", { name: /Register Now/i });
    expect(registerLink).toHaveAttribute("href", "/register");

    const loginLink = screen.getByRole("link", { name: /Sign In/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("renders footer with platform links", () => {
    render(<Home />);

    expect(screen.getByText("Lokonomy")).toBeInTheDocument();
    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    expect(screen.getByText("Job Board")).toBeInTheDocument();
  });
});
