import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminDashboard from "../../admin/AdminDashboard";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import * as socketService from "../../../services/socket";
import { toast } from "react-hot-toast";

// Mock Recharts to avoid SVG rendering issues in testing
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div data-testid="recharts-areachart">{children}</div>,
  Area: () => <div data-testid="recharts-area" />,
  Tooltip: () => <div data-testid="recharts-tooltip" />,
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

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../services", () => ({
  adminService: {
    getDashboardStats: vi.fn(),
    getOnlineTrend: vi.fn(),
  },
}));

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

const mockSocketInstance = {
  on: vi.fn(),
  off: vi.fn(),
};

vi.spyOn(socketService, "connectSocket").mockReturnValue(mockSocketInstance);

const mockStatsData = {
  data: {
    stats: {
      totalRevenue: 50000,
      totalUsers: 1200,
      totalBusinesses: 450,
      totalProducts: 3000,
      totalJobs: 150,
      trends: {
        revenue: "+15%",
        users: "+5%",
        businesses: "+10%",
        products: "+2%",
        jobs: "-1%",
      },
      revenueBreakdown: {
        silver: 10000,
        gold: 15000,
        platinum: 25000,
      },
    },
    recentUsers: [
      {
        _id: "u1",
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date().toISOString(),
      },
    ],
    recentBusinesses: [
      {
        _id: "b1",
        businessName: "Tech Hub",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  },
};

describe("AdminDashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getDashboardStats.mockResolvedValue(mockStatsData);
    adminService.getOnlineTrend.mockResolvedValue({
      data: [{ count: 10 }, { count: 15 }, { count: 20 }],
    });
    localStorage.setItem("adminInfo", JSON.stringify({ id: "admin123" }));
  });

  it("renders loading state initially", () => {
    adminService.getDashboardStats.mockReturnValue(new Promise(() => {}));
    render(<AdminDashboard />);
    expect(screen.getByText("Preparing environment…")).toBeInTheDocument();
  });

  it("renders stats cards correctly", async () => {
    render(<AdminDashboard />);

    await screen.findByText("Dashboard");

    // Revenue
    expect(screen.getByText("₹50,000")).toBeInTheDocument();
    expect(screen.getByText("+15%")).toBeInTheDocument();

    // Users
    expect(screen.getByText("1,200")).toBeInTheDocument();

    // Businesses
    expect(screen.getByText("450")).toBeInTheDocument();

    // Products
    expect(screen.getByText("3,000")).toBeInTheDocument();

    // Jobs
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("renders revenue breakdown bars", async () => {
    render(<AdminDashboard />);
    await screen.findByText("Premium");

    // Check amounts
    expect(screen.getByText("₹10,000")).toBeInTheDocument();
    expect(screen.getByText("₹15,000")).toBeInTheDocument();
    expect(screen.getByText("₹25,000")).toBeInTheDocument();

    // Check percentages (10k/50k = 20%, 15k/50k = 30%, 25k/50k = 50%)
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("renders recent joiners and activities from initial fetch", async () => {
    render(<AdminDashboard />);
    
    // John Doe appears in both Joiners and Activity feed
    const nameElements = await screen.findAllByText("John Doe");
    expect(nameElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("john@example.com")).toBeInTheDocument();

    // The activity feed mixes users and businesses
    expect(screen.getByText(/signed up to Lokonomy/i)).toBeInTheDocument();
    expect(screen.getByText(/registered a new business/i)).toBeInTheDocument();
    expect(screen.getByText("Tech Hub")).toBeInTheDocument();
  });

  it("handles empty state for recent joiners and activities", async () => {
    adminService.getDashboardStats.mockResolvedValue({
      data: {
        stats: mockStatsData.data.stats,
        recentUsers: [],
        recentBusinesses: [],
      },
    });
    render(<AdminDashboard />);

    await screen.findByText("No recent users found");
    expect(screen.getByText("Waiting for activities...")).toBeInTheDocument();
  });

  it("navigates to specific pages when stat cards are clicked", async () => {
    render(<AdminDashboard />);
    await screen.findByText("1,200"); // Users

    const usersCard = screen
      .getByText("Total Users")
      .closest("div").parentElement;
    fireEvent.click(usersCard);
    expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
  });

  it("handles date range filtering", async () => {
    render(<AdminDashboard />);
    await screen.findByText("Dashboard");

    const startDateInput = screen.getByTitle("Start date");
    const endDateInput = screen.getByTitle("End date");

    fireEvent.change(startDateInput, {
      target: { name: "startDate", value: "2023-01-01" },
    });
    fireEvent.change(endDateInput, {
      target: { name: "endDate", value: "2023-01-31" },
    });

    await waitFor(() => {
      expect(adminService.getDashboardStats).toHaveBeenCalledWith({
        startDate: "2023-01-01",
        endDate: "2023-01-31",
      });
    });

    // Clear dates
    const clearBtn = screen.getByTitle("Clear date range");
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(adminService.getDashboardStats).toHaveBeenCalledWith({});
    });
  });

  it("handles socket events", async () => {
    render(<AdminDashboard />);
    await screen.findByText("Dashboard");

    // Trigger socket callbacks manually
    const onlineUsersCallback = mockSocketInstance.on.mock.calls.find(
      (call) => call[0] === "onlineUsersCount",
    )[1];
    const newActivityCallback = mockSocketInstance.on.mock.calls.find(
      (call) => call[0] === "newActivity",
    )[1];

    waitFor(() => {
      onlineUsersCallback(42);
    });

    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    waitFor(() => {
      newActivityCallback({
        id: "act1",
        user: "Alice",
        message: "posted a new item",
        time: new Date().toISOString(),
        icon: <span>Icon</span>,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText(/posted a new item/i)).toBeInTheDocument();
    });
  });

  it("shows error toast when fetching stats fails", async () => {
    adminService.getDashboardStats.mockRejectedValue(new Error("Fetch error"));
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch statistics");
    });
  });
});
