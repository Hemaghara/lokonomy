import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import PromoteBusiness from "../PromoteBusiness";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { businessService, promotedService } from "../../services";

// Mock services
vi.mock("../../services", () => ({
  businessService: {
    getMyBusinesses: vi.fn(),
  },
  promotedService: {
    getBusinessPromotions: vi.fn(),
    createPromotion: vi.fn(),
  },
}));

const mockBusinesses = [
  {
    _id: "biz-1",
    businessName: "Glow Salon",
    district: "North Goa",
  },
  {
    _id: "biz-2",
    businessName: "Ocean Cafe",
    district: "South Goa",
  },
];

const mockPromotions = [
  {
    _id: "promo-101",
    type: "search_boost",
    status: "active",
    budget: 1000,
    spent: 450,
    impressions: 4500,
    clicks: 120,
  },
  {
    _id: "promo-102",
    type: "featured_badge",
    status: "completed",
    budget: 500,
    spent: 500,
    impressions: 3333,
    clicks: 85,
  },
];

describe("PromoteBusiness Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    businessService.getMyBusinesses.mockResolvedValue({
      data: mockBusinesses,
    });
    promotedService.getBusinessPromotions.mockResolvedValue({
      data: { promotions: mockPromotions },
    });
    promotedService.createPromotion.mockResolvedValue({
      data: { success: true },
    });
  });

  it("renders loading spinner initially", () => {
    businessService.getMyBusinesses.mockReturnValue(new Promise(() => {}));
    render(<PromoteBusiness />);
    expect(screen.getByText(/Loading business information.../i)).toBeInTheDocument();
  });

  it("renders register business alert if user has no businesses", async () => {
    businessService.getMyBusinesses.mockResolvedValue({ data: [] });

    render(<PromoteBusiness />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("No Businesses Registered")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Add Your Business/i })).toHaveAttribute("href", "/add-business");
  });

  it("renders form elements and lists active campaigns when business is loaded", async () => {
    render(<PromoteBusiness />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Check configuration inputs
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Glow Salon (North Goa)")).toBeInTheDocument();

    // Check active promotions list
    expect(screen.getByText("SEARCH BOOST")).toBeInTheDocument();
    expect(screen.getByText("FEATURED BADGE")).toBeInTheDocument();
    expect(screen.getByText("Spent: ₹450.00")).toBeInTheDocument();
    expect(screen.getByText("4500 Views")).toBeInTheDocument();
    expect(screen.getByText("120 Clicks")).toBeInTheDocument();
  });

  it("calculates estimated views dynamically based on budget and campaign type CPM", async () => {
    render(<PromoteBusiness />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Default: Search Boost (CPM = 0.10), Budget = 1000 -> 1000 / 0.10 = 10,000 views
    expect(screen.getByText("~10,000")).toBeInTheDocument();

    // Change promotion type to Featured Badge (CPM = 0.15), Budget = 1000 -> 1000 / 0.15 = 6667 views
    const featuredCard = screen.getByText("Featured Badge");
    fireEvent.click(featuredCard);

    expect(screen.getByText("~6,667")).toBeInTheDocument();

    // Change budget tier to ₹5000 -> 5000 / 0.15 = 33333 views
    const budgetBtn = screen.getByRole("button", { name: "₹5000" });
    fireEvent.click(budgetBtn);

    expect(screen.getByText("~33,333")).toBeInTheDocument();

    // Custom budget input: ₹150 -> 150 / 0.15 = 1000 views
    const customBudgetInput = screen.getByPlaceholderText(/Enter Custom Budget/i);
    fireEvent.change(customBudgetInput, { target: { value: "150" } });

    expect(screen.getByText("~1,000")).toBeInTheDocument();
  });

  it("submits the ad campaign form and updates campaign list", async () => {
    render(<PromoteBusiness />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Pay & Launch Campaign/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(promotedService.createPromotion).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: "biz-1",
          type: "search_boost",
          budget: 1000,
          paymentId: expect.stringContaining("pay_sim_"),
        })
      );
    });
  });
});
