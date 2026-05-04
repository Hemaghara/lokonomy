import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminUserDetails from "../../admin/AdminUserDetails";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

// Mock react-hot-toast
vi.mock("react-hot-toast", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      loading: vi.fn(),
    },
  };
});

// Mock AdminLayout
vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

const mockNavigate = vi.fn();
// Mock react-router-dom with useParams
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "u1" }),
    useNavigate: () => mockNavigate,
  };
});

// Mock window.location.href
const originalLocation = window.location;
beforeAll(() => {
  delete window.location;
  window.location = { href: "" };
});
afterAll(() => {
  window.location = originalLocation;
});

// Mock adminService
vi.mock("../../../services", () => ({
  adminService: {
    getUserDetails: vi.fn(),
    getUserRiskScore: vi.fn(),
    updateUserStatus: vi.fn(),
    impersonateUser: vi.fn(),
  },
}));

const mockUserDetails = {
  user: {
    _id: "u1",
    name: "Alice Smith",
    email: "alice@example.com",
    phoneNumber: "9876543210",
    status: "active",
    loyaltyPoints: 1200,
    district: "Mehsana",
    taluka: "Kadi",
    locationName: "123 Main St, Kadi",
    subscription: { plan: "Premium", status: "active" },
    createdAt: new Date().toISOString(),
  },
  businesses: [
    {
      _id: "b1",
      businessName: "Alice Shop",
      mainCategory: "Retail",
      district: "Mehsana",
    },
  ],
  products: [],
  jobs: [
    {
      _id: "j1",
      title: "Sales Executive",
      jobType: "Full-time",
      createdAt: new Date().toISOString(),
    },
  ],
  orders: [
    {
      _id: "o1",
      product: { name: "Smart Watch", images: ["img.jpg"] },
      price: 2000,
      paymentStatus: "Paid",
    },
    { _id: "o2", product: null, price: 500, paymentStatus: "Pending" }, // No product
  ],
};

const mockSuspendedUser = {
  ...mockUserDetails,
  user: { ...mockUserDetails.user, status: "suspended" },
};

const mockEmptyAssetsUser = {
  ...mockUserDetails,
  businesses: [],
  products: [],
  jobs: [],
  orders: [],
};

const mockRiskData = { riskScore: 15, flags: ["New Account"] };
const mockHighRiskData = {
  riskScore: 85,
  flags: ["Multiple IPs", "Suspicious transactions"],
};

describe("AdminUserDetails Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getUserDetails.mockResolvedValue({ data: mockUserDetails });
    adminService.getUserRiskScore.mockResolvedValue({ data: mockRiskData });
    adminService.updateUserStatus.mockResolvedValue({
      data: { success: true },
    });
    adminService.impersonateUser.mockResolvedValue({
      data: {
        token: "mock-token",
        user: { _id: "u1", name: "Alice Smith" },
        message: "Impersonation successful",
      },
    });
  });

  it("renders loading state initially", () => {
    adminService.getUserDetails.mockImplementationOnce(
      () => new Promise(() => {}),
    );
    render(<AdminUserDetails />);
    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  it("handles fetch user details error", async () => {
    adminService.getUserDetails.mockRejectedValueOnce(new Error("Fetch Error"));
    render(<AdminUserDetails />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch user details");
      expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
    });
  });

  it("renders user profile and statistics", async () => {
    render(<AdminUserDetails />);

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("1200 pts")).toBeInTheDocument();
      expect(screen.getByText("Premium")).toBeInTheDocument();
      expect(screen.getByText("123 Main St, Kadi")).toBeInTheDocument();
      expect(screen.getByText("Alice Shop")).toBeInTheDocument();
      expect(screen.getByText("Sales Executive")).toBeInTheDocument();
      expect(screen.getByText("Smart Watch")).toBeInTheDocument();
      expect(screen.getByText("Product Item")).toBeInTheDocument(); // For o2
    });
  });

  it("handles back button", async () => {
    render(<AdminUserDetails />);

    await waitFor(() => screen.getByText("Alice Smith"));

    const backBtn = screen.getByRole("button", { name: /Back to Users/i });
    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
  });

  it("handles suspend and ban status update", async () => {
    render(<AdminUserDetails />);

    await waitFor(() => screen.getByText("Alice Smith"));

    const suspendBtn = screen.getByRole("button", { name: /Suspend/i });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(adminService.updateUserStatus).toHaveBeenCalledWith(
        "u1",
        "suspended",
      );
      expect(toast.success).toHaveBeenCalledWith("User is now suspended");
      expect(adminService.getUserDetails).toHaveBeenCalledTimes(2);
    });

    const banBtn = screen.getByRole("button", { name: /Ban Account/i });
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(adminService.updateUserStatus).toHaveBeenCalledWith(
        "u1",
        "banned",
      );
      expect(toast.success).toHaveBeenCalledWith("User is now banned");
    });
  });

  it("handles status update error", async () => {
    adminService.updateUserStatus.mockRejectedValueOnce(
      new Error("Update Error"),
    );
    render(<AdminUserDetails />);

    await waitFor(() => screen.getByText("Alice Smith"));

    const suspendBtn = screen.getByRole("button", { name: /Suspend/i });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update status");
    });
  });

  it("renders activate button for non-active users and handles activation", async () => {
    adminService.getUserDetails.mockResolvedValueOnce({
      data: mockSuspendedUser,
    });
    render(<AdminUserDetails />);

    await waitFor(() => screen.getByText("Alice Smith"));

    const activateBtn = screen.getByRole("button", { name: /Activate/i });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(adminService.updateUserStatus).toHaveBeenCalledWith(
        "u1",
        "active",
      );
      expect(toast.success).toHaveBeenCalledWith("User is now active");
    });
  });

  it("handles impersonation success", async () => {
    render(<AdminUserDetails />);

    await waitFor(() => screen.getByText("Alice Smith"));

    const impersonateBtn = screen.getByRole("button", {
      name: /Log in as User/i,
    });
    fireEvent.click(impersonateBtn);

    await waitFor(() => {
      expect(toast.loading).toHaveBeenCalledWith("Starting impersonation...", {
        id: "impersonate",
      });
      expect(adminService.impersonateUser).toHaveBeenCalledWith("u1");
      expect(localStorage.getItem("impersonationToken")).toBe("mock-token");
      expect(toast.success).toHaveBeenCalledWith("Impersonation successful", {
        id: "impersonate",
      });
      expect(window.location.href).toBe("/");
    });
  });

  it("handles impersonation failure", async () => {
    adminService.impersonateUser.mockRejectedValueOnce({
      response: { data: { message: "Impersonation failed message" } },
    });
    render(<AdminUserDetails />);

    await waitFor(() => screen.getByText("Alice Smith"));

    const impersonateBtn = screen.getByRole("button", {
      name: /Log in as User/i,
    });
    fireEvent.click(impersonateBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Impersonation failed message", {
        id: "impersonate",
      });
    });
  });

  it("renders risk score and flags correctly (low risk)", async () => {
    render(<AdminUserDetails />);

    await waitFor(() => {
      expect(screen.getByText("15%")).toBeInTheDocument();
      expect(screen.getByText("New Account")).toBeInTheDocument();
    });
  });

  it("renders risk score and flags correctly (high risk)", async () => {
    adminService.getUserRiskScore.mockResolvedValueOnce({
      data: mockHighRiskData,
    });
    render(<AdminUserDetails />);

    await waitFor(() => {
      expect(screen.getByText("85%")).toBeInTheDocument();
      expect(screen.getByText("Multiple IPs")).toBeInTheDocument();
      expect(screen.getByText("Suspicious transactions")).toBeInTheDocument();
    });
  });

  it("handles risk fetch error silently", async () => {
    adminService.getUserRiskScore.mockRejectedValueOnce(
      new Error("Risk Error"),
    );
    render(<AdminUserDetails />);

    await waitFor(() => screen.getByText("Alice Smith"));
    // Risk score section shouldn't appear
    expect(screen.queryByText("Fraud Risk Analysis")).not.toBeInTheDocument();
  });

  it("handles viewing business details", async () => {
    render(<AdminUserDetails />);

    await waitFor(() => screen.getByText("Alice Shop"));

    // Find the eye icon button inside the business card
    const businessButtons = screen.getAllByRole("button");
    // Assuming the business view button is one of them. We'll find it by structure or mockNavigate.
    // It's the 6th button or so (Back, Suspend, Ban, Impersonate, Eye).
    // Let's rely on firing click on all buttons until navigate is called.

    // Simpler: find all buttons and click the last one which is in the business card
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[4]); // Eye button

    expect(mockNavigate).toHaveBeenCalledWith("/admin/business/b1");
  });

  it("renders empty asset placeholders when no assets exist", async () => {
    adminService.getUserDetails.mockResolvedValueOnce({
      data: mockEmptyAssetsUser,
    });
    render(<AdminUserDetails />);

    await waitFor(() => {
      expect(screen.getByText("No businesses registered.")).toBeInTheDocument();
      expect(screen.getByText("No job postings found.")).toBeInTheDocument();
      expect(
        screen.getByText("No order history available."),
      ).toBeInTheDocument();
    });
  });
});
