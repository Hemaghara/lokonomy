import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminReferrals from "../../admin/AdminReferrals";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("../../../services", () => ({
  adminService: {
    getAllReferrals: vi.fn(),
    getTopReferrers: vi.fn(),
    getReferralLeaderboard: vi.fn(),
  },
}));

const mockAllReferrals = {
  data: {
    referrals: [
      {
        _id: "r1",
        name: "Referrer One",
        email: "ref1@test.com",
        referralCode: "REF100",
        referralRewards: { totalReferrals: 10, appliedDays: 5 },
        createdAt: new Date("2023-01-01").toISOString(),
      },
    ],
    pagination: { pages: 3, total: 15 },
    stats: { totalReferralsMade: 50 },
  },
};

const mockTopReferrers = {
  data: {
    topReferrers: [
      {
        _id: "t1",
        name: "Top User",
        email: "top@test.com",
        referralCode: "TOP123",
        referralRewards: { totalReferrals: 100, appliedDays: 30 },
      },
    ],
  },
};

const mockLeaderboard = {
  data: {
    leaderboard: [
      {
        _id: "l1",
        name: "Winner",
        email: "win@test.com",
        referralCode: "WINNER",
        referralRewards: { totalReferrals: 500, appliedDays: 100 },
      },
      {
        _id: "l2",
        name: "Second Place",
        email: "second@test.com",
        referralCode: "SECOND",
        referralRewards: { totalReferrals: 400, appliedDays: 90 },
      },
      {
        _id: "l3",
        name: "Third Place",
        email: "third@test.com",
        referralCode: "THIRD",
        referralRewards: { totalReferrals: 300, appliedDays: 80 },
      },
      {
        _id: "l4",
        name: "Fourth Place",
        email: "fourth@test.com",
        referralCode: "FOURTH",
        referralRewards: { totalReferrals: 200, appliedDays: 70 },
      },
    ],
    pagination: { pages: 1 },
  },
};

describe("AdminReferrals Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getAllReferrals.mockResolvedValue(mockAllReferrals);
    adminService.getTopReferrers.mockResolvedValue(mockTopReferrers);
    adminService.getReferralLeaderboard.mockResolvedValue(mockLeaderboard);
  });

  it("renders loading state initially", () => {
    adminService.getAllReferrals.mockImplementation(
      () => new Promise(() => {}),
    );
    render(<AdminReferrals />);
    expect(screen.getByText("Syncing data…")).toBeInTheDocument();
  });

  it("renders referral stats and list for all tab", async () => {
    render(<AdminReferrals />);

    await waitFor(async () => {
      const elements = await screen.findAllByText("Referrer One");
      expect(elements[0]).toBeInTheDocument();
      expect(screen.getAllByText("REF100")[0]).toBeInTheDocument();
      expect(screen.getByText("Active Referral Codes")).toBeInTheDocument();
      expect(screen.getAllByText("15")[0]).toBeInTheDocument(); // totalCount
      expect(screen.getAllByText("50")[0]).toBeInTheDocument(); // totalReferralsMade
    });
  });

  it("renders empty state when data is empty", async () => {
    adminService.getAllReferrals.mockResolvedValueOnce({
      data: {
        referrals: [],
        pagination: { pages: 1, total: 0 },
        stats: { totalReferralsMade: 0 },
      },
    });
    render(<AdminReferrals />);

    await waitFor(() => {
      expect(screen.getByText("No Data Yet")).toBeInTheDocument();
    });
  });

  it("handles error when fetching data", async () => {
    adminService.getAllReferrals.mockRejectedValueOnce(
      new Error("Network error"),
    );
    render(<AdminReferrals />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch referral data");
    });
  });

  it("switches to top referrers tab", async () => {
    render(<AdminReferrals />);

    await screen.findAllByText("Referrer One");

    const topTab = screen.getByRole("button", { name: /Top Referrers/i });
    fireEvent.click(topTab);

    await waitFor(() => {
      expect(screen.getAllByText("Top User")[0]).toBeInTheDocument();
      expect(adminService.getTopReferrers).toHaveBeenCalled();
    });
  });

  it("switches to leaderboard tab and renders ranks", async () => {
    render(<AdminReferrals />);

    await screen.findAllByText("Referrer One");

    const leaderTab = screen.getByRole("button", { name: /Leaderboard/i });
    fireEvent.click(leaderTab);

    await waitFor(() => {
      expect(screen.getAllByText("Winner")[0]).toBeInTheDocument();
      expect(adminService.getReferralLeaderboard).toHaveBeenCalled();

      // Rank text check - we have "1", "2", "3", "4" in the leaderboard.
      // In desktop view: it's in a td. In mobile: it's in a div.
      // test-utils renders both desktop and mobile views by default if window sizing isn't specified, but we can verify text presence.
      const rankOnes = screen.getAllByText("1");
      expect(rankOnes.length).toBeGreaterThan(0);

      const rankFours = screen.getAllByText("4");
      expect(rankFours.length).toBeGreaterThan(0);
    });
  });

  it("handles pagination next and previous", async () => {
    render(<AdminReferrals />);

    await screen.findAllByText("Referrer One");

    const nextBtn = screen.getByLabelText("Next page");
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(adminService.getAllReferrals).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        }),
      );
    });

    const prevBtn = screen.getByLabelText("Previous page");
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(adminService.getAllReferrals).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        }),
      );
    });
  });

  it("handles numbered pagination buttons", async () => {
    render(<AdminReferrals />);

    await screen.findAllByText("Referrer One");

    // pages 1, 2, 3 should be rendered
    const page3Btn = screen.getByRole("button", { name: "3" });
    fireEvent.click(page3Btn);

    await waitFor(() => {
      expect(adminService.getAllReferrals).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 3,
        }),
      );
    });
  });
});
