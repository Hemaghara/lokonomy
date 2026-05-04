import React from "react";
import { render, screen, fireEvent, waitFor, act } from "../../utils/test-utils";
import AdminDashboard from "../admin/AdminDashboard";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../services";
import { connectSocket } from "../../services/socket";
import { toast } from "react-hot-toast";

// Mock adminService
vi.mock("../../services", () => ({
  adminService: {
    getDashboardStats: vi.fn(),
    getOnlineTrend: vi.fn(),
  },
}));

// Mock socket
vi.mock("../../services/socket", () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
  return {
    connectSocket: vi.fn(() => mockSocket),
    disconnectSocket: vi.fn(),
    mockSocket, // Export for use in tests
  };
});

// Mock react-hot-toast
vi.mock("react-hot-toast", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      loading: vi.fn(),
      dismiss: vi.fn(),
    },
  };
});

// Mock Recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }) => <svg data-testid="area-chart">{children}</svg>,
  Area: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
}));

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, layout, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock layouts
vi.mock("../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockStatsData = {
  stats: {
    totalRevenue: 150000,
    totalUsers: 1200,
    totalBusinesses: 85,
    totalProducts: 450,
    totalJobs: 25,
    revenueBreakdown: { silver: 30000, gold: 50000, platinum: 70000 },
    trends: {
      revenue: "+15%",
      users: "+8%",
      businesses: "+5%",
      products: "+12%",
      jobs: "+2%",
    },
  },
  recentUsers: [
    {
      _id: "u1",
      name: "Alice Smith",
      email: "alice@example.com",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "u2",
      name: "Bob Jones",
      email: "bob@example.com",
      createdAt: new Date().toISOString(),
    },
  ],
  recentBusinesses: [
    {
      _id: "b1",
      businessName: "Tech Hub",
      createdAt: new Date().toISOString(),
    },
  ],
};

describe("AdminDashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem(
      "adminInfo",
      JSON.stringify({ id: "admin1", name: "Admin" }),
    );
    adminService.getDashboardStats.mockResolvedValue({ data: mockStatsData });
    adminService.getOnlineTrend.mockResolvedValue({
      data: [{ count: 5 }, { count: 8 }, { count: 12 }],
    });
  });

  it("renders loading state initially", () => {
    adminService.getDashboardStats.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<AdminDashboard />);
    expect(screen.getByText(/Preparing environment/i)).toBeInTheDocument();
  });

  it("renders dashboard stats correctly after loading", async () => {
    render(<AdminDashboard />);

    await screen.findByRole("heading", { name: /Dashboard/i });
 
    expect(await screen.findByText(/1.*50/)).toBeInTheDocument();
    expect(await screen.findByText(/1.*200/)).toBeInTheDocument();
    expect(await screen.findByText("85")).toBeInTheDocument();
    expect(await screen.findByText("450")).toBeInTheDocument();
    expect(screen.getAllByText(/Alice/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText("Tech Hub")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/signed up to Lokonomy/)[0]).toBeInTheDocument();
  });

  it("handles date range filtering", async () => {
    render(<AdminDashboard />);

    await waitFor(() => screen.getByText(/Dashboard/i));

    const startDateInput = screen.getByTitle("Start date");
    const endDateInput = screen.getByTitle("End date");

    fireEvent.change(startDateInput, { target: { value: "2023-01-01" } });
    fireEvent.change(endDateInput, { target: { value: "2023-01-31" } });

    await waitFor(() => {
      expect(adminService.getDashboardStats).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: "2023-01-01",
          endDate: "2023-01-31",
        }),
      );
    });
  });

  it("clears date range filter", async () => {
    render(<AdminDashboard />);

    await waitFor(() => screen.getByText(/Dashboard/i));

    const startDateInput = screen.getByTitle("Start date");
    fireEvent.change(startDateInput, { target: { value: "2023-01-01" } });

    const clearBtn = screen.getByTitle("Clear date range");
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(startDateInput.value).toBe("");
      expect(adminService.getDashboardStats).toHaveBeenLastCalledWith({});
    });
  });

  it("displays revenue breakdown accurately", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Platinum Tier/i)).toBeInTheDocument();
      expect(screen.getByText(/₹70,000/)).toBeInTheDocument();
    });
  });

  it("handles API error for stats", async () => {
    adminService.getDashboardStats.mockRejectedValue(new Error("API Error"));
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch statistics");
    });
  });

  it("sets up socket listeners for live updates", async () => {
    const { mockSocket } = await import("../../services/socket");
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(connectSocket).toHaveBeenCalled();
      expect(mockSocket.on).toHaveBeenCalledWith(
        "onlineUsersCount",
        expect.any(Function),
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        "newActivity",
        expect.any(Function),
      );
    });
  });

  it("updates online count when socket event is received", async () => {
    const { mockSocket } = await import("../../services/socket");
    render(<AdminDashboard />);

    await waitFor(() => screen.getByText(/Online Users/i));

    // Find the callback for 'onlineUsersCount'
    const callback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "onlineUsersCount",
    )[1];

    // Trigger callback
    act(() => {
      callback(42);
    });

    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  it("adds new activity when socket event is received", async () => {
    const { mockSocket } = await import("../../services/socket");
    render(<AdminDashboard />);

    await waitFor(() => screen.getByRole("heading", { name: /Live Activity/i }));

    const callback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "newActivity",
    )[1];

    const newActivity = {
      id: "act123",
      user: "New User",
      message: "just joined",
      time: new Date().toISOString(),
      icon: <span>🆕</span>,
    };

    act(() => {
      callback(newActivity);
    });

    await waitFor(() => {
      expect(screen.getByText("New User")).toBeInTheDocument();
      expect(screen.getByText(/just joined/)).toBeInTheDocument();
    });
  });

  it("navigates to users page when clicking user stat card", async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      const userCard = screen.getByText("Total Users").closest("div");
      fireEvent.click(userCard);
      expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
    });
  });

  it("shows empty state when no activities exist", async () => {
    adminService.getDashboardStats.mockResolvedValue({
      data: { ...mockStatsData, recentUsers: [], recentBusinesses: [] },
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Waiting for activities/i)).toBeInTheDocument();
    });
  });
});
