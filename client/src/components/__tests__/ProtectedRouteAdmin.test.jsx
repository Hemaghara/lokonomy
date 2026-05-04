import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "../../utils/test-utils";
import ProtectedRouteAdmin, { resetVerificationCache } from "../ProtectedRouteAdmin";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../services";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast } from "react-hot-toast";

vi.mock("../../services", () => ({
  adminService: {
    verify: vi.fn(),
    reauth: vi.fn(),
  },
}));

vi.mock("react-hot-toast", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toast: {
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

// Helper to create a fake JWT
const createFakeToken = (expOffsetSeconds) => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
    }),
  );
  return `${header}.${payload}.signature`;
};

describe("ProtectedRouteAdmin Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    resetVerificationCache();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderComponent = (role) => {
    return render(
      <Routes>
        <Route path="/" element={<ProtectedRouteAdmin requiredRole={role} />}>
          <Route
            index
            element={<div data-testid="admin-content">Admin Content</div>}
          />
        </Route>
        <Route
          path="/admin/login"
          element={<div data-testid="login">Login</div>}
        />
        <Route
          path="/admin/dashboard"
          element={<div data-testid="dashboard">Dashboard</div>}
        />
      </Routes>
    );
  };

  it("shows loading state initially", () => {
    localStorage.setItem("adminToken", "faketoken");
    adminService.verify.mockReturnValue(new Promise(() => {})); // Never resolves
    renderComponent();
    expect(screen.getByText("Validating Credentials...")).toBeInTheDocument();
  });

  it("redirects to login if no token is found", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId("login")).toBeInTheDocument();
    });
  });

  it("redirects to login if verify fails", async () => {
    localStorage.setItem("adminToken", "faketoken");
    adminService.verify.mockRejectedValueOnce(new Error("Invalid token"));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("login")).toBeInTheDocument();
    });
    expect(localStorage.getItem("adminToken")).toBeNull();
  });

  it("renders content if verified and no role required", async () => {
    localStorage.setItem("adminToken", createFakeToken(3600)); // 1 hour valid
    adminService.verify.mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("admin-content")).toBeInTheDocument();
    });
  });

  it("redirects to dashboard if verified but role mismatches", async () => {
    localStorage.setItem("adminToken", createFakeToken(3600));
    localStorage.setItem("adminInfo", JSON.stringify({ role: "moderator" }));
    adminService.verify.mockResolvedValueOnce({});

    renderComponent("superadmin");

    await waitFor(() => {
      expect(screen.getByTestId("dashboard")).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith(
        "Forbidden: superadmin access required",
      );
    });
  });

  it("shows timeout modal if token is about to expire (< 300s)", async () => {
    localStorage.setItem("adminToken", createFakeToken(200)); // expires in 200s
    adminService.verify.mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("admin-content")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Session Warning/i }),
      ).toBeInTheDocument();
    });
  });

  it("handles reauthentication in timeout modal", async () => {
    localStorage.setItem("adminToken", createFakeToken(200));
    localStorage.setItem(
      "adminInfo",
      JSON.stringify({ name: "Admin", role: "admin" }),
    );
    adminService.verify.mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Session Warning/i }),
      ).toBeInTheDocument();
    });

    adminService.reauth.mockResolvedValueOnce({
      data: { token: "newtoken", admin: { name: "Admin", role: "admin" } },
    });

    const passwordInput = screen.getByPlaceholderText(/Enter password/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    fireEvent.click(screen.getByText("Stay Logged In"));

    await waitFor(() => {
      expect(adminService.reauth).toHaveBeenCalledWith("password123");
      expect(
        screen.queryByRole("heading", { name: /Session Warning/i }),
      ).not.toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith(
        "Session successfully extended",
      );
    });
  });

  it("handles reauthentication failure", async () => {
    localStorage.setItem("adminToken", createFakeToken(200));
    adminService.verify.mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Session Warning/i }),
      ).toBeInTheDocument();
    });

    adminService.reauth.mockRejectedValueOnce(new Error("Invalid password"));

    const passwordInput = screen.getByPlaceholderText(/Enter password/i);
    fireEvent.change(passwordInput, { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByText("Stay Logged In"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Invalid password. Please try again.",
      );
      expect(
        screen.getByRole("heading", { name: /Session Warning/i }),
      ).toBeInTheDocument();
    });
  });

  it("handles manual logout from timeout modal", async () => {
    localStorage.setItem("adminToken", createFakeToken(200));
    adminService.verify.mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Session Warning/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Logout Now/i));

    await waitFor(() => {
      expect(localStorage.getItem("adminToken")).toBeNull();
      // Verify redirect happened due to token removal (via state change)
      expect(screen.getByTestId("login")).toBeInTheDocument();
    });
  });
});
