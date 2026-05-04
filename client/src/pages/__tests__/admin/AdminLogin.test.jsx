import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminLogin from "../../admin/AdminLogin";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

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
    login: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AdminLogin Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders login form correctly", () => {
    render(<AdminLogin />);

    expect(screen.getByText("Lokonomy Admin")).toBeInTheDocument();
    expect(screen.getByText("Control Center Access")).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign In to Panel/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Create Admin")).toBeInTheDocument();
  });

  it("shows error if email is missing", async () => {
    render(<AdminLogin />);

    const submitBtn = screen.getByRole("button", { name: /Sign In to Panel/i });
    fireEvent.click(submitBtn);

    expect(toast.error).toHaveBeenCalledWith(
      "Please enter your admin email address",
    );
    expect(adminService.login).not.toHaveBeenCalled();
  });

  it("shows error if password is missing", async () => {
    render(<AdminLogin />);

    const emailInput = screen.getByLabelText(/Email Address/i);
    fireEvent.change(emailInput, {
      target: { name: "email", value: "admin@test.com" },
    });

    const submitBtn = screen.getByRole("button", { name: /Sign In to Panel/i });
    fireEvent.click(submitBtn);

    expect(toast.error).toHaveBeenCalledWith("Please enter your password");
    expect(adminService.login).not.toHaveBeenCalled();
  });

  it("handles successful login", async () => {
    const mockResponse = {
      data: {
        token: "test-token",
        user: { id: "admin1", email: "admin@test.com" },
      },
    };
    adminService.login.mockResolvedValue(mockResponse);

    render(<AdminLogin />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { name: "email", value: "admin@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { name: "password", value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In to Panel/i }));

    expect(screen.getByText("Authenticating...")).toBeInTheDocument();

    await waitFor(() => {
      expect(adminService.login).toHaveBeenCalledWith({
        email: "admin@test.com",
        password: "password123",
      });
      expect(localStorage.getItem("adminToken")).toBe("test-token");
      expect(JSON.parse(localStorage.getItem("adminInfo"))).toEqual(
        mockResponse.data,
      );
      expect(toast.success).toHaveBeenCalledWith("Welcome back, Admin!");
      expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("handles login failure with specific message", async () => {
    adminService.login.mockRejectedValue({
      response: { data: { message: "Invalid credentials" } },
    });

    render(<AdminLogin />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { name: "email", value: "admin@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { name: "password", value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In to Panel/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it("handles login failure with generic message", async () => {
    adminService.login.mockRejectedValue(new Error("Network error"));

    render(<AdminLogin />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { name: "email", value: "admin@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { name: "password", value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In to Panel/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Login failed. Please check your credentials.",
      );
    });
  });
});
