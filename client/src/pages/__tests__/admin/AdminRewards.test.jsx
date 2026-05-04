import { render, screen, waitFor, fireEvent, act } from "../../../utils/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminRewards from "../../../pages/admin/AdminRewards";
import * as services from "../../../services";
import { toast } from "react-hot-toast";

const mockStats = {
  stats: {
    totalActivePoints: 10000,
    totalPointsEarned: 25000,
    totalPointsRedeemed: 15000,
    totalRedemptions: 50,
    activeUsers: 100,
  },
};

const mockBalances = {
  users: [
    {
      _id: "user1",
      name: "John Doe",
      email: "john@example.com",
      loyaltyPoints: 500,
      subscription: { plan: "premium" },
      createdAt: "2023-01-01T00:00:00Z",
    },
    {
      _id: "user2",
      name: "Jane Smith",
      email: "jane@example.com",
      loyaltyPoints: 1200,
      createdAt: "2023-02-01T00:00:00Z",
    },
  ],
  pagination: { totalPages: 2 },
};

const mockHistory = {
  history: [
    {
      _id: "hist1",
      userName: "John Doe",
      userEmail: "john@example.com",
      amount: -100,
      event: "purchase_reward",
      description: "Used points for purchase",
      createdAt: "2023-03-01T00:00:00Z",
    },
    {
      _id: "hist2",
      userName: "Jane Smith",
      userEmail: "jane@example.com",
      amount: 50,
      event: "signup_bonus",
      description: "Sign up bonus",
      createdAt: "2023-03-02T00:00:00Z",
    },
  ],
  pagination: { totalPages: 1 },
};

describe("AdminRewards Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(services.adminService, 'getRewardsStats').mockResolvedValue({ data: mockStats });
    vi.spyOn(services.adminService, 'getLoyaltyBalances').mockResolvedValue({ data: mockBalances });
    vi.spyOn(services.adminService, 'getRedemptionHistory').mockResolvedValue({ data: mockHistory });
    vi.spyOn(services.adminService, 'updateLoyaltyPoints').mockResolvedValue({});
    
    // Also spy on toast
    vi.spyOn(toast, 'success');
    vi.spyOn(toast, 'error');
  });

  const renderComponent = () => {
    return render(<AdminRewards />);
  };

  it("renders loading states initially", () => {
    vi.spyOn(services.adminService, 'getRewardsStats').mockImplementation(() => new Promise(() => {}));
    vi.spyOn(services.adminService, 'getLoyaltyBalances').mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    expect(screen.getByText(/Syncing user data.../i)).toBeInTheDocument();
  });

  it("fetches and displays stats and balances successfully", async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText(/Active Points/i)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/500/)).toBeInTheDocument();
    });
  });

  it("handles errors when fetching data", async () => {
    vi.spyOn(services.adminService, 'getRewardsStats').mockRejectedValue(new Error("Error"));
    vi.spyOn(services.adminService, 'getLoyaltyBalances').mockRejectedValue(new Error("Error"));
    vi.spyOn(services.adminService, 'getRedemptionHistory').mockRejectedValue(new Error("Error"));

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("switches to history tab and displays history", async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    const historyTab = screen.getByRole("button", { name: /Log/i });
    await act(async () => {
      fireEvent.click(historyTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Activity/i)).toBeInTheDocument();
      expect(screen.getByText(/Ledger/i)).toBeInTheDocument();
      expect(screen.getByText("-100")).toBeInTheDocument();
      expect(screen.getByText("+50")).toBeInTheDocument();
    });
  });

  it("allows searching users by name or email", async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search members.../i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "jane" } });
    });

    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    expect(screen.queryByText(/John Doe/i)).not.toBeInTheDocument();
  });

  it("shows no results found when search has no matches", async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search members.../i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });
    });

    await waitFor(() => {
      expect(screen.getByText(/No Results Found/i)).toBeInTheDocument();
    });
  });

  it("allows editing loyalty points", async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    await act(async () => {
      fireEvent.click(editBtns[0]);
    });

    const pointsInput = screen.getByRole("spinbutton");
    await act(async () => {
      fireEvent.change(pointsInput, { target: { value: "600" } });
    });

    const reasonInput = screen.getByPlaceholderText(/Log entry reason.../i);
    await act(async () => {
      fireEvent.change(reasonInput, { target: { value: "Bonus points" } });
    });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(services.adminService.updateLoyaltyPoints).toHaveBeenCalledWith("user1", {
        points: 600,
        reason: "Bonus points",
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("shows validation error when points are empty", async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    await act(async () => {
      fireEvent.click(editBtns[0]);
    });

    const pointsInput = screen.getByRole("spinbutton");
    await act(async () => {
      fireEvent.change(pointsInput, { target: { value: "" } });
    });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("handles API error when saving points", async () => {
    vi.spyOn(services.adminService, 'updateLoyaltyPoints').mockRejectedValue({
      response: { data: { message: "Update failed" } },
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    await act(async () => {
      fireEvent.click(editBtns[0]);
    });

    const pointsInput = screen.getByRole("spinbutton");
    await act(async () => {
      fireEvent.change(pointsInput, { target: { value: "600" } });
    });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("handles empty states for balances and history", async () => {
    vi.spyOn(services.adminService, 'getLoyaltyBalances').mockResolvedValue({ 
      data: { users: [], pagination: { totalPages: 0 } } 
    });
    vi.spyOn(services.adminService, 'getRedemptionHistory').mockResolvedValue({ 
      data: { history: [], pagination: { totalPages: 0 } } 
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText(/No Results Found/i)).toBeInTheDocument();
    });

    const historyTab = screen.getByRole("button", { name: /Log/i });
    await act(async () => {
      fireEvent.click(historyTab);
    });

    await waitFor(() => {
      expect(screen.getByText(/Ledger Empty/i)).toBeInTheDocument();
    });
  });

  it("handles pagination for balances and history", async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    const page2Btn = screen.getByRole("button", { name: "2" });
    await act(async () => {
      fireEvent.click(page2Btn);
    });

    await waitFor(() => {
      expect(services.adminService.getLoyaltyBalances).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });
  });
});
