import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import UpgradePlan from "../UpgradePlan";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { subscriptionService, referralService } from "../../services";
import { toast } from "react-hot-toast";

// Mock services
vi.mock("../../services", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    subscriptionService: {
      ...actual.subscriptionService,
      getPlans: vi.fn().mockResolvedValue({
        data: {
          success: true,
          plans: {
            silver: {
              prices: { 3: 199, 6: 349, 12: 599 },
              limits: { productsUploaded: 20 },
            },
            gold: {
              prices: { 3: 399, 6: 699, 12: 1199 },
              limits: { productsUploaded: 100 },
            },
            platinum: {
              prices: { 3: 799, 6: 1399, 12: 2399 },
              limits: { productsUploaded: "Unlimited" },
            },
          },
        },
      }),
      getStatus: vi.fn().mockResolvedValue({
        data: {
          subscription: { plan: "free", isActive: false },
          limits: { productsUpload: 3, storiesPost: 5 },
          usage: { productsUploaded: 1, storiesPosted: 0 },
        },
      }),
      createOrder: vi.fn().mockResolvedValue({
        data: {
          orderId: "ord_123",
          amount: 199,
          currency: "INR",
          keyId: "rzp_test",
        },
      }),
      verifyPayment: vi.fn().mockResolvedValue({
        data: { success: true, user: { id: "u1", name: "Updated User" } },
      }),
      logFailedPayment: vi.fn(),
    },
    referralService: {
      ...actual.referralService,
      validateReferralCode: vi.fn().mockResolvedValue({
        data: { success: true, referralCode: "LOKO-123" },
      }),
    },
  };
});

const { mockUserValue } = vi.hoisted(() => ({
  mockUserValue: {
    user: {
      id: "u1",
      name: "Test User",
      email: "test@example.com",
      plan: "free",
    },
    updateUser: vi.fn(),
  },
}));

vi.mock("../../context/UserContext", () => ({
  useUser: () => mockUserValue,
}));

describe("UpgradePlan Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });


  it("validates referral code and shows discount price", async () => {
    render(<UpgradePlan />);

    await waitFor(() => screen.getByPlaceholderText(/e.g. LOKO-AB12/i));

    const input = screen.getByPlaceholderText(/e.g. LOKO-AB12/i);
    fireEvent.change(input, { target: { value: "LOKO-123" } });

    const applyBtn = screen.getByRole("button", { name: /Apply/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(referralService.validateReferralCode).toHaveBeenCalledWith(
        "LOKO-123",
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Referral code applied"),
      );
    });

    // Check if discount is applied to price (e.g., 199 -> 169)
    await screen.findByText(/169/);
  });

  it("handles invalid referral code", async () => {
    referralService.validateReferralCode.mockRejectedValueOnce(
      new Error("Invalid"),
    );
    render(<UpgradePlan />);

    await waitFor(() => screen.getByPlaceholderText(/e.g. LOKO-AB12/i));
    const input = screen.getByPlaceholderText(/e.g. LOKO-AB12/i);
    fireEvent.change(input, { target: { value: "WRONG" } });
    fireEvent.click(screen.getByRole("button", { name: /Apply/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid referral code");
    });
  });

  it("changes plan duration and updates prices", async () => {
    render(<UpgradePlan />);

    await waitFor(() => screen.getAllByText("6 Months")[0]);

    const sixMonthsBtn = screen.getAllByText("6 Months")[0];
    fireEvent.click(sixMonthsBtn);

    // Silver price for 6 months should be 349
    await waitFor(() => {
      expect(screen.getByText("349")).toBeDefined();
    });
  });



});
