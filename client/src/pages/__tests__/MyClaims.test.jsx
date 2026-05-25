import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import MyClaims from "../MyClaims";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { guaranteeService } from "../../services";

// Mock guaranteeService
vi.mock("../../services", () => ({
  guaranteeService: {
    getMyClaims: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockClaims = [
  {
    _id: "claim-1",
    status: "pending",
    reason: "Product was damaged on delivery",
    evidence: "Photo of cracked item attached.",
    orderId: {
      _id: "order-101",
    },
    createdAt: "2026-05-20T10:00:00.000Z",
    resolution: "",
    refundAmount: 0,
  },
  {
    _id: "claim-2",
    status: "resolved_buyer",
    reason: "Wrong item received",
    evidence: "Received a blue shirt instead of red shirt.",
    orderId: {
      _id: "order-102",
    },
    createdAt: "2026-05-18T10:00:00.000Z",
    resolution: "Buyer has been fully refunded.",
    refundAmount: 750,
  },
  {
    _id: "claim-3",
    status: "rejected",
    reason: "Lost package",
    evidence: "Tracking number says not delivered.",
    orderId: {
      _id: "order-103",
    },
    createdAt: "2026-05-15T10:00:00.000Z",
    resolution: "Delivery verified by photo proof from courier.",
    refundAmount: 0,
  },
];

describe("MyClaims Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state spinner initially", () => {
    guaranteeService.getMyClaims.mockReturnValue(new Promise(() => {}));
    render(<MyClaims />);
    expect(screen.getByText(/Loading Dispute Center.../i)).toBeInTheDocument();
  });

  it("renders empty state when there are no claims", async () => {
    guaranteeService.getMyClaims.mockResolvedValue({
      data: { success: true, claims: [] },
    });

    render(<MyClaims />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("No active disputes")).toBeInTheDocument();
    expect(screen.getByText(/Your account is in perfect standing/i)).toBeInTheDocument();
  });

  it("renders active dispute claims with details and correct statuses", async () => {
    guaranteeService.getMyClaims.mockResolvedValue({
      data: { success: true, claims: mockClaims },
    });

    render(<MyClaims />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    // Check Claim IDs
    expect(screen.getByText("Claim ID: #LAIM-1")).toBeInTheDocument();
    expect(screen.getByText("Claim ID: #LAIM-2")).toBeInTheDocument();
    expect(screen.getByText("Claim ID: #LAIM-3")).toBeInTheDocument();

    // Check statuses
    expect(screen.getByText("Pending Review")).toBeInTheDocument();
    expect(screen.getByText("Resolved (Buyer Refunded)")).toBeInTheDocument();
    expect(screen.getByText("Claim Rejected")).toBeInTheDocument();

    // Check reasons
    expect(screen.getByText(/Product was damaged on delivery/i)).toBeInTheDocument();
    expect(screen.getByText(/Wrong item received/i)).toBeInTheDocument();

    // Check evidence
    expect(screen.getByText("Photo of cracked item attached.")).toBeInTheDocument();

    // Check refund amount and resolution notes
    expect(screen.getByText("Buyer has been fully refunded.")).toBeInTheDocument();
    expect(screen.getByText("Refund Amount: ₹750")).toBeInTheDocument();
  });

  it("handles back to orders navigation click", async () => {
    guaranteeService.getMyClaims.mockResolvedValue({
      data: { success: true, claims: [] },
    });

    render(<MyClaims />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const backBtn = screen.getByRole("button", { name: /Back to Orders/i });
    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/my-orders");
  });
});
