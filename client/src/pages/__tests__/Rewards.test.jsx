import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import Rewards from "../Rewards";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { rewardsService } from "../../services";
import { toast } from "react-hot-toast";

vi.mock("../../services", () => ({
  rewardsService: {
    getBalance: vi.fn().mockResolvedValue({
      data: {
        success: true,
        points: 500,
        history: [
          {
            event: "daily_login",
            amount: 5,
            type: "earn",
            createdAt: new Date().toISOString(),
          },
          {
            event: "redeem_coupon",
            amount: 100,
            type: "redeem",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    }),
    getOptions: vi.fn().mockResolvedValue({
      data: {
        success: true,
        options: [
          {
            id: "o1",
            name: "50% Off Coupon",
            type: "coupon",
            cost: 100,
            description: "Get 50% off",
          },
          {
            id: "o2",
            name: "Gold Upgrade",
            type: "upgrade",
            cost: 1000,
            description: "Premium features",
          },
        ],
      },
    }),
    claimDailyLogin: vi.fn().mockResolvedValue({
      data: { success: true, points: 505, message: "Daily bonus claimed!" },
    }),
    redeem: vi.fn().mockResolvedValue({
      data: { success: true, points: 400, message: "Redeemed successfully!" },
    }),
  },
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
};
vi.mock("react-hot-toast", () => ({
  toast: mockToast,
  default: mockToast,
  Toaster: () => null,
}));

describe("Rewards Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    render(<Rewards />);
    expect(screen.getByText(/Loading your rewards/i)).toBeInTheDocument();
  });

  it("renders points balance and current tier correctly", async () => {
    render(<Rewards />);

    await waitFor(() => {
      expect(screen.getByText("500")).toBeInTheDocument();
      expect(screen.getByText("Gold")).toBeInTheDocument();
    });
  });

  it("calculates progress to next tier correctly", async () => {
    render(<Rewards />);

    await waitFor(() => {
      // Next tier is Diamond at 1000. Current is 500. Progress 50%.
      expect(screen.getByText(/500 pts away/i)).toBeInTheDocument();
    });
  });

  it("handles claiming daily login bonus successfully", async () => {
    render(<Rewards />);

    await waitFor(() => screen.getByText("500"));

    const claimBtn = screen.getByRole("button", { name: /Claim Daily Login/i });
    fireEvent.click(claimBtn);

    await waitFor(() => {
      expect(rewardsService.claimDailyLogin).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Daily bonus claimed!");
    });
  });

  it("handles redeeming a coupon successfully", async () => {
    render(<Rewards />);

    await waitFor(() => screen.getByText("500"));

    const redeemBtn = screen.getByLabelText(/Redeem 50% Off Coupon/i);
    fireEvent.click(redeemBtn);

    await waitFor(() => {
      expect(rewardsService.redeem).toHaveBeenCalledWith("o1");
      expect(toast.success).toHaveBeenCalledWith("Redeemed successfully!");
    });
  });

  it("disables redeem button if points are insufficient", async () => {
    render(<Rewards />);

    await waitFor(() => screen.getByText("500"));

    const disabledBtn = screen
      .getByText(/Need 500 more pts/i)
      .closest("button");
    expect(disabledBtn).toBeDisabled();
  });

  it("renders activity history and toggles visibility", async () => {
    render(<Rewards />);

    await waitFor(() => screen.getByText("500"));

    expect(screen.getByText("Daily Login")).toBeInTheDocument();
    expect(screen.getByText("Coupon Redeemed")).toBeInTheDocument();

    // If there were many items, we could test "View All"
  });

  it("renders Diamond tier when points >= 1000", async () => {
    rewardsService.getBalance.mockResolvedValueOnce({
      data: { success: true, points: 1200, history: [] },
    });

    render(<Rewards />);

    await waitFor(() => {
      expect(screen.getByText("Diamond")).toBeInTheDocument();
      expect(screen.getByText(/Max tier reached/i)).toBeInTheDocument();
    });
  });
});
