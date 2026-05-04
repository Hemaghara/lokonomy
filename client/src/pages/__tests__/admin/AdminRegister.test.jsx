import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminRegister from "../../admin/AdminRegister";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

// Mock react-hot-toast
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

// Mock adminService
vi.mock("../../../services", () => ({
  adminService: {
    register: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AdminRegister Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    adminService.register.mockResolvedValue({
      data: {
        token: "mock-token",
        name: "New Admin",
        role: "admin",
      },
    });
  });

  // ─── RENDERING ───────────────────────────────────────────────────────────

  it("renders registration form correctly", () => {
    render(<AdminRegister />);

    expect(screen.getAllByText("Admin Signup")[0]).toBeDefined();
    expect(screen.getByText("Create a new controller account")).toBeDefined();
    expect(screen.getByPlaceholderText("John Doe")).toBeDefined();
    expect(screen.getByPlaceholderText("admin@lokonomy.com")).toBeDefined();
    expect(screen.getByPlaceholderText("••••••••")).toBeDefined();
    expect(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    ).toBeDefined();
  });

  it("renders all form labels", () => {
    render(<AdminRegister />);

    expect(screen.getByText("Full Name")).toBeDefined();
    expect(screen.getByText("Email Address")).toBeDefined();
    expect(screen.getByText("Password")).toBeDefined();
    expect(screen.getByText("Role")).toBeDefined();
  });

  it("renders Sign In link", () => {
    render(<AdminRegister />);

    expect(screen.getByText("Already have an account?")).toBeDefined();
    const signInLink = screen.getByText("Sign In");
    expect(signInLink).toBeDefined();
    expect(signInLink.closest("a")).toHaveAttribute("href", "/admin/login");
  });

  it("renders role select with all options", () => {
    render(<AdminRegister />);

    const roleSelect = screen.getAllByRole("combobox")[0];
    expect(roleSelect).toBeDefined();

    const options = roleSelect.querySelectorAll("option");
    expect(options.length).toBe(3);
    expect(options[0].value).toBe("superadmin");
    expect(options[1].value).toBe("admin");
    expect(options[2].value).toBe("moderator");
  });

  it("defaults role to admin", () => {
    render(<AdminRegister />);

    const roleSelect = screen.getAllByRole("combobox")[0];
    expect(roleSelect.value).toBe("admin");
  });

  // ─── INPUT CHANGES ───────────────────────────────────────────────────────

  it("handles name input change", () => {
    render(<AdminRegister />);

    const nameInput = screen.getByPlaceholderText("John Doe");
    fireEvent.change(nameInput, {
      target: { value: "Jane Admin", name: "name" },
    });
    expect(nameInput.value).toBe("Jane Admin");
  });

  it("handles email input change", () => {
    render(<AdminRegister />);

    const emailInput = screen.getByPlaceholderText("admin@lokonomy.com");
    fireEvent.change(emailInput, {
      target: { value: "jane@test.com", name: "email" },
    });
    expect(emailInput.value).toBe("jane@test.com");
  });

  it("handles password input change", () => {
    render(<AdminRegister />);

    const passwordInput = screen.getByPlaceholderText("••••••••");
    fireEvent.change(passwordInput, {
      target: { value: "secret123", name: "password" },
    });
    expect(passwordInput.value).toBe("secret123");
  });

  it("handles role selection change", () => {
    render(<AdminRegister />);

    const roleSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(roleSelect, {
      target: { value: "superadmin", name: "role" },
    });
    expect(roleSelect.value).toBe("superadmin");
  });

  it("handles role change to moderator", () => {
    render(<AdminRegister />);

    const roleSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(roleSelect, {
      target: { value: "moderator", name: "role" },
    });
    expect(roleSelect.value).toBe("moderator");
  });

  // ─── VALIDATION ──────────────────────────────────────────────────────────

  it("shows error for empty name", async () => {
    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "   ", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "test@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please enter your full name");
    });
    expect(adminService.register).not.toHaveBeenCalled();
  });

  it("shows error for empty email", async () => {
    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Valid Name", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "  ", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please enter an email address");
    });
    expect(adminService.register).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Valid Name", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "invalid-email", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please enter a valid email address",
      );
    });
    expect(adminService.register).not.toHaveBeenCalled();
  });

  it("shows error for empty password", async () => {
    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Valid Name", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "test@test.com", name: "email" },
    });
    // password stays empty

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please create a password");
    });
    expect(adminService.register).not.toHaveBeenCalled();
  });

  it("shows error for short password (less than 6 chars)", async () => {
    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Valid Name", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "test@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "12345", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Password must be at least 6 characters long",
      );
    });
    expect(adminService.register).not.toHaveBeenCalled();
  });

  it("accepts password exactly 6 characters", async () => {
    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Valid Name", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "test@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "123456", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(adminService.register).toHaveBeenCalled();
    });
  });

  // ─── SUCCESSFUL SUBMISSION ───────────────────────────────────────────────

  it("submits form successfully", async () => {
    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "New Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "new@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(adminService.register).toHaveBeenCalledWith({
        name: "New Admin",
        email: "new@test.com",
        password: "password123",
        role: "admin",
      });
    });
  });

  it("stores token in localStorage on success", async () => {
    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "New Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "new@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(localStorage.getItem("adminToken")).toBe("mock-token");
    });
  });

  it("stores admin info in localStorage on success", async () => {
    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "New Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "new@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      const adminInfo = JSON.parse(localStorage.getItem("adminInfo"));
      expect(adminInfo.token).toBe("mock-token");
      expect(adminInfo.name).toBe("New Admin");
      expect(adminInfo.role).toBe("admin");
    });
  });

  it("shows success toast on registration", async () => {
    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "New Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "new@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Admin account created successfully!",
      );
    });
  });

  it("navigates to dashboard on success", async () => {
    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "New Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "new@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("submits with superadmin role", async () => {
    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Super Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "super@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    const roleSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(roleSelect, {
      target: { value: "superadmin", name: "role" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(adminService.register).toHaveBeenCalledWith(
        expect.objectContaining({ role: "superadmin" }),
      );
    });
  });

  // ─── FAILURE HANDLING ────────────────────────────────────────────────────

  it("handles registration failure with server message", async () => {
    adminService.register.mockRejectedValueOnce({
      response: { data: { message: "Email already exists" } },
    });

    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "New Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "exists@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email already exists");
    });
  });

  it("handles registration failure with fallback message", async () => {
    adminService.register.mockRejectedValueOnce(new Error("Network error"));

    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "New Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "new@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Registration failed. Please check your information.",
      );
    });
  });

  it("does NOT store token on failed registration", async () => {
    adminService.register.mockRejectedValueOnce({
      response: { data: { message: "Email already exists" } },
    });

    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "New Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "exists@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(adminService.register).toHaveBeenCalled();
    });
    expect(localStorage.getItem("adminToken")).toBeNull();
  });

  it("does NOT navigate on failed registration", async () => {
    adminService.register.mockRejectedValueOnce(new Error("fail"));

    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "New Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "new@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(adminService.register).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ─── LOADING STATE ───────────────────────────────────────────────────────

  it("shows loading state during submission", async () => {
    adminService.register.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { token: "tok", name: "A", role: "admin" },
              }),
            200,
          ),
        ),
    );

    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "New Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "new@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    // Should show loading text
    expect(screen.getByText("Creating Account...")).toBeDefined();

    // Button should be disabled during loading
    const submitBtn = screen.getByText("Creating Account...").closest("button");
    expect(submitBtn).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /Complete Registration/i })[0],
      ).not.toBeDisabled();
    });
  });

  it("re-enables button after failed submission", async () => {
    adminService.register.mockRejectedValueOnce(new Error("fail"));

    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "New Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "new@test.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /Complete Registration/i })[0],
      ).not.toBeDisabled();
    });
  });

  // ─── INPUT FIELD TYPES ───────────────────────────────────────────────────

  it("email field has type email", () => {
    render(<AdminRegister />);
    expect(screen.getByPlaceholderText("admin@lokonomy.com").type).toBe(
      "email",
    );
  });

  it("password field has type password", () => {
    render(<AdminRegister />);
    expect(screen.getByPlaceholderText("••••••••").type).toBe("password");
  });

  it("name field has type text", () => {
    render(<AdminRegister />);
    expect(screen.getByPlaceholderText("John Doe").type).toBe("text");
  });

  // ─── CONSOLE ERROR ON FAILURE ─────────────────────────────────────────────

  it("logs console error on registration failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockError = new Error("Server error");
    adminService.register.mockRejectedValueOnce(mockError);

    render(<AdminRegister />);

    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Admin", name: "name" },
    });
    fireEvent.change(screen.getByPlaceholderText("admin@lokonomy.com"), {
      target: { value: "a@b.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123", name: "password" },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Complete Registration/i })[0],
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Admin Registration Error:",
        mockError,
      );
    });

    consoleSpy.mockRestore();
  });
});
