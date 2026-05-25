import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import Leaderboard from "../Leaderboard";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { leaderboardService, influencerService } from "../../services";
import { useUser } from "../../context/UserContext";

// Mock services
vi.mock("../../services", () => ({
  leaderboardService: {
    getLeaderboard: vi.fn(),
    calculateLeaderboard: vi.fn(),
  },
  influencerService: {
    getLocalInfluencers: vi.fn(),
  },
}));

// Mock useUser
vi.mock("../../context/UserContext", () => ({
  useUser: vi.fn(),
}));

const mockLeaderboard = [
  {
    _id: "entry-1",
    rank: 1,
    businessId: {
      _id: "biz-1",
      businessName: "Glow Salon",
      logo: "/salon.png",
      verified: true,
    },
    category: "Services",
    district: "North Goa",
    score: 95,
    metrics: {
      orderCount: 150,
      reviewAvg: 4.8,
      visitCount: 600,
      storyEngagement: 300,
      reviewCount: 45,
    },
  },
  {
    _id: "entry-2",
    rank: 2,
    businessId: {
      _id: "biz-2",
      businessName: "Ocean Cafe",
      logo: "/cafe.png",
    },
    category: "Food & Beverage",
    district: "North Goa",
    score: 88,
  },
  {
    _id: "entry-3",
    rank: 3,
    businessId: {
      _id: "biz-3",
      businessName: "Fresh Veggies",
      logo: "/grocer.png",
    },
    category: "Grocery",
    district: "North Goa",
    score: 82,
  },
  {
    _id: "entry-4",
    rank: 4,
    businessId: {
      _id: "biz-4",
      businessName: "Electro Store",
      logo: "/electro.png",
    },
    category: "Electronics",
    district: "North Goa",
    score: 75,
  },
];

const mockInfluencers = [
  {
    _id: "inf-1",
    name: "Alex Guide",
    influencerSince: "2025-01-01T00:00:00.000Z",
    influencerBadge: "ambassador",
    district: "North Goa",
    reviewCount: 52,
    helpfulVotes: 120,
  },
];

describe("Leaderboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default regular user
    useUser.mockReturnValue({
      user: { id: "user-1", name: "Regular User", role: "user" },
    });

    leaderboardService.getLeaderboard.mockResolvedValue({
      data: {
        success: true,
        leaderboard: mockLeaderboard,
        filters: { districts: ["North Goa", "South Goa"], categories: ["Services", "Grocery"] },
      },
    });

    influencerService.getLocalInfluencers.mockResolvedValue({
      data: {
        success: true,
        influencers: mockInfluencers,
      },
    });
  });

  it("renders loading spinner and then lists standings", async () => {
    render(<Leaderboard />);

    expect(screen.getByText(/Fetching standings.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Fetching standings.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("Glow Salon")).toBeInTheDocument();
    expect(screen.getByText("Ocean Cafe")).toBeInTheDocument();
    expect(screen.getByText("Fresh Veggies")).toBeInTheDocument();
    expect(screen.getByText("Electro Store")).toBeInTheDocument();
  });

  it("toggles the metrics breakdown panel when details is clicked", async () => {
    render(<Leaderboard />);

    await waitFor(() => screen.getByText("Glow Salon"));

    // Verify Glow Salon detail expandable is not initially shown
    expect(screen.queryByText("Metric Breakdown")).not.toBeInTheDocument();

    // The Details buttons exist on the list entries (like Electro Store)
    // For podium entries, it says "Metrics"
    // reorderedPodium orders entries as [Rank 2, Rank 1, Rank 3]. 
    // Glow Salon is 1st place (Rank 1), which is at index 1.
    const metricsBtn = screen.getAllByRole("button", { name: /Metrics/i })[1];
    fireEvent.click(metricsBtn);

    expect(screen.getByText("Metric Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Orders (40%)")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("shares/copies ranking to clipboard", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    render(<Leaderboard />);

    await waitFor(() => screen.getByText("Glow Salon"));

    // Find the first share button
    const shareBtns = screen.getAllByTitle("Share ranking");
    fireEvent.click(shareBtns[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it("switches tabs to local influencers", async () => {
    render(<Leaderboard />);

    await waitFor(() => screen.getByText("Glow Salon"));

    const influencerTab = screen.getByRole("button", { name: /Local Influencers/i });
    fireEvent.click(influencerTab);

    await waitFor(() => {
      expect(screen.getByText("Alex Guide")).toBeInTheDocument();
    });

    expect(screen.getByText("✨ ambassador")).toBeInTheDocument();
    expect(screen.getByText("52")).toBeInTheDocument(); // reviews count
  });

  it("recomputes rankings if user is admin", async () => {
    // Override user to admin
    useUser.mockReturnValue({
      user: { id: "admin-1", name: "Admin", role: "superadmin" },
    });
    leaderboardService.calculateLeaderboard.mockResolvedValue({
      data: { success: true },
    });

    render(<Leaderboard />);

    await waitFor(() => screen.getByText("Glow Salon"));

    const recalcBtn = screen.getByRole("button", { name: /Recalculate Leaderboard/i });
    expect(recalcBtn).toBeInTheDocument();

    fireEvent.click(recalcBtn);

    expect(leaderboardService.calculateLeaderboard).toHaveBeenCalled();
  });

  it("does not show recalculate button for non-admins", async () => {
    useUser.mockReturnValue({
      user: { id: "user-1", name: "User", role: "user" },
    });

    render(<Leaderboard />);

    await waitFor(() => screen.getByText("Glow Salon"));

    expect(screen.queryByRole("button", { name: /Recalculate Leaderboard/i })).not.toBeInTheDocument();
  });
});
