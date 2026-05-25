import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import SubscriptionBoxes from "../SubscriptionBoxes";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { subscriptionBoxService } from "../../services/subscriptionBoxService";
import { businessService } from "../../services/businessService";

// Mock services
vi.mock("../../services/subscriptionBoxService", () => ({
  subscriptionBoxService: {
    getBusinessBoxes: vi.fn(),
    subscribeToBox: vi.fn(),
    unsubscribeFromBox: vi.fn(),
  },
}));

vi.mock("../../services/businessService", () => ({
  businessService: {
    getBusinesses: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  };
});

const mockBusinesses = [
  {
    _id: "biz-1",
    businessName: "Amrut Organic Farms",
    district: "North Goa",
  },
];

const mockBoxes = [
  {
    _id: "box-101",
    name: "Weekly Veggie Crate",
    description: "Assorted organic vegetables picked fresh.",
    price: 350,
    frequency: "weekly",
    items: ["Spinach", "Tomatoes", "Carrots", "Potatoes"],
    subscribers: ["other-user"],
  },
  {
    _id: "box-102",
    name: "Monthly Dairy Bundle",
    description: "Milk, ghee, and local paneer bundle.",
    price: 800,
    frequency: "monthly",
    items: ["Milk 5L", "Paneer 1kg", "Ghee 500g"],
    subscribers: ["mock-user-id"], // User is subscribed to this one
  },
];

describe("SubscriptionBoxes Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    businessService.getBusinesses.mockResolvedValue({
      data: mockBusinesses,
    });
    subscriptionBoxService.getBusinessBoxes.mockResolvedValue({
      data: { success: true, boxes: mockBoxes },
    });
  });

  it("renders loading spinner initially", () => {
    businessService.getBusinesses.mockReturnValue(new Promise(() => {}));
    render(<SubscriptionBoxes />);
    expect(screen.getByText(/Loading curation crates.../i)).toBeInTheDocument();
  });

  it("renders list of subscription boxes when loaded", async () => {
    render(<SubscriptionBoxes />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("Weekly Veggie Crate")).toBeInTheDocument();
    expect(screen.getByText("Weekly Veggie Crate").closest("div")).toHaveTextContent("Amrut Organic Farms");
    expect(screen.getByText("Monthly Dairy Bundle")).toBeInTheDocument();

    // Check items list
    expect(screen.getByText("Spinach")).toBeInTheDocument();
    expect(screen.getByText("Paneer 1kg")).toBeInTheDocument();

    // Verify prices & frequency
    expect(screen.getByText("₹350")).toBeInTheDocument();
    expect(screen.getByText("weekly")).toBeInTheDocument();
    expect(screen.getByText("₹800")).toBeInTheDocument();
    expect(screen.getByText("monthly")).toBeInTheDocument();
  });

  it("filters subscription boxes by district when input changes", async () => {
    render(<SubscriptionBoxes />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by district/i);
    fireEvent.change(searchInput, { target: { value: "South Goa" } });

    // API should be queried with the new district filter
    expect(businessService.getBusinesses).toHaveBeenCalledWith({ district: "South Goa" });
  });

  it("subscribes to a box successfully", async () => {
    subscriptionBoxService.subscribeToBox.mockResolvedValue({
      data: { success: true },
    });

    render(<SubscriptionBoxes />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Weekly Veggie Crate (box-101) is not subscribed -> button should say "Subscribe"
    const subscribeBtn = screen.getAllByRole("button", { name: /Subscribe/i })[0];
    fireEvent.click(subscribeBtn);

    expect(subscriptionBoxService.subscribeToBox).toHaveBeenCalledWith("box-101");
  });

  it("unsubscribes from a box after confirmation successfully", async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    subscriptionBoxService.unsubscribeFromBox.mockResolvedValue({
      data: { success: true },
    });

    render(<SubscriptionBoxes />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Monthly Dairy Bundle (box-102) is subscribed -> button should say "Subscribed"
    const unsubscribeBtn = screen.getByRole("button", { name: /Subscribed/i });
    fireEvent.click(unsubscribeBtn);

    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to cancel your subscription to Monthly Dairy Bundle?");
    expect(subscriptionBoxService.unsubscribeFromBox).toHaveBeenCalledWith("box-102");
  });
});
