import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminProfile from "../../admin/AdminProfile";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

// Mock adminService
vi.mock("../../../services", () => ({
  adminService: {
    updateProfile: vi.fn(),
  },
}));

describe("AdminProfile Page", () => {
  const mockAdmin = {
    _id: "a1",
    name: "Main Admin",
    email: "admin@test.com",
    role: "superadmin",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("adminInfo", JSON.stringify(mockAdmin));

    adminService.updateProfile.mockResolvedValue({
      data: {
        name: "Updated Admin",
        email: "updated@test.com",
        role: "superadmin",
        token: "new-mock-token",
      },
    });
  });

  it("renders loading state when admin is null", () => {
    localStorage.removeItem("adminInfo");
    render(<AdminProfile />);
    expect(screen.getByText("Loading profile…")).toBeInTheDocument();
  });

  it("renders initial profile data from localStorage", async () => {
    render(<AdminProfile />);

    await waitFor(() => {
      expect(screen.getByText("Main Admin")).toBeInTheDocument();
      expect(screen.getAllByText("superadmin").length).toBeGreaterThan(0);
      expect(screen.getByDisplayValue("Main Admin")).toBeInTheDocument();
      expect(screen.getByDisplayValue("admin@test.com")).toBeInTheDocument();
    });
  });

  it("handles navigation to dashboard via top button", async () => {
    render(<AdminProfile />);
    await screen.findByDisplayValue("Main Admin");

    const dashboardBtn = screen.getByText("Dashboard").closest("button");
    fireEvent.click(dashboardBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("handles navigation to dashboard via cancel button", async () => {
    render(<AdminProfile />);
    await screen.findByDisplayValue("Main Admin");

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("handles profile update without password", async () => {
    render(<AdminProfile />);

    await screen.findByDisplayValue("Main Admin");

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, {
      target: { value: "Updated Admin", name: "name" },
    });

    const updateBtn = screen.getByRole("button", { name: /Update Profile/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(adminService.updateProfile).toHaveBeenCalledWith({
        name: "Updated Admin",
        email: "admin@test.com",
        role: "superadmin",
      });
      expect(JSON.parse(localStorage.getItem("adminInfo")).name).toBe(
        "Updated Admin",
      );
      expect(localStorage.getItem("adminToken")).toBe("new-mock-token");
      expect(toast.success).toHaveBeenCalledWith(
        "Profile updated successfully!",
      );
    });
  });

  it("handles profile update with valid password", async () => {
    render(<AdminProfile />);

    await screen.findByDisplayValue("Main Admin");

    const passInput = screen.getByPlaceholderText(
      "Leave blank to keep current",
    );
    const confirmInput = screen.getByPlaceholderText("Must match password");

    fireEvent.change(passInput, {
      target: { value: "StrongPass123!", name: "password" },
    });
    fireEvent.change(confirmInput, {
      target: { value: "StrongPass123!", name: "confirmPassword" },
    });

    const updateBtn = screen.getByRole("button", { name: /Update Profile/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(adminService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          password: "StrongPass123!",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Profile updated successfully!",
      );
    });
  });

  it("shows error on profile update failure", async () => {
    adminService.updateProfile.mockRejectedValueOnce({
      response: { data: { message: "Email already exists" } },
    });

    render(<AdminProfile />);
    await screen.findByDisplayValue("Main Admin");

    const updateBtn = screen.getByRole("button", { name: /Update Profile/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email already exists");
    });
  });

  it("shows default error on profile update failure if message is absent", async () => {
    adminService.updateProfile.mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<AdminProfile />);
    await screen.findByDisplayValue("Main Admin");

    const updateBtn = screen.getByRole("button", { name: /Update Profile/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update profile");
    });
  });

  it("validates password length < 8", async () => {
    render(<AdminProfile />);
    await screen.findByDisplayValue("Main Admin");

    const passInput = screen.getByPlaceholderText(
      "Leave blank to keep current",
    );
    fireEvent.change(passInput, {
      target: { value: "Pass1!", name: "password" },
    });

    const updateBtn = screen.getByRole("button", { name: /Update Profile/i });
    fireEvent.click(updateBtn);

    expect(toast.error).toHaveBeenCalledWith(
      "Password must be at least 8 characters long",
    );
    expect(adminService.updateProfile).not.toHaveBeenCalled();
  });

  it("validates password complexity", async () => {
    render(<AdminProfile />);
    await screen.findByDisplayValue("Main Admin");

    const passInput = screen.getByPlaceholderText(
      "Leave blank to keep current",
    );
    // length is > 8 but missing special char
    fireEvent.change(passInput, {
      target: { value: "Password123", name: "password" },
    });

    const updateBtn = screen.getByRole("button", { name: /Update Profile/i });
    fireEvent.click(updateBtn);

    expect(toast.error).toHaveBeenCalledWith(
      "Password must contain uppercase, lowercase, number, and special character.",
    );
    expect(adminService.updateProfile).not.toHaveBeenCalled();
  });

  it("validates passwords match", async () => {
    render(<AdminProfile />);
    await screen.findByDisplayValue("Main Admin");

    const passInput = screen.getByPlaceholderText(
      "Leave blank to keep current",
    );
    const confirmInput = screen.getByPlaceholderText("Must match password");

    fireEvent.change(passInput, {
      target: { value: "StrongPass123!", name: "password" },
    });
    fireEvent.change(confirmInput, {
      target: { value: "StrongPass123?", name: "confirmPassword" },
    });

    const updateBtn = screen.getByRole("button", { name: /Update Profile/i });
    fireEvent.click(updateBtn);

    expect(toast.error).toHaveBeenCalledWith("Passwords do not match!");
    expect(adminService.updateProfile).not.toHaveBeenCalled();
  });

  it("disables role selection for non-superadmin", async () => {
    localStorage.setItem(
      "adminInfo",
      JSON.stringify({ ...mockAdmin, role: "moderator" }),
    );

    render(<AdminProfile />);

    await screen.findByDisplayValue("Main Admin");

    const roleSelect = screen.getByRole("combobox", { name: /Account Role/i });
    expect(roleSelect).toBeDisabled();
    expect(
      screen.getByText("* Only superadmins can modify roles"),
    ).toBeInTheDocument();
  });

  it("enables role selection for superadmin", async () => {
    render(<AdminProfile />);

    await screen.findByDisplayValue("Main Admin");

    const roleSelect = screen.getByRole("combobox", { name: /Account Role/i });
    expect(roleSelect).not.toBeDisabled();

    fireEvent.change(roleSelect, { target: { value: "admin", name: "role" } });
    expect(roleSelect.value).toBe("admin");
  });

  it("toggles password visibility", async () => {
    render(<AdminProfile />);
    await screen.findByDisplayValue("Main Admin");

    const passInput = screen.getByPlaceholderText(
      "Leave blank to keep current",
    );
    const confirmInput = screen.getByPlaceholderText("Must match password");

    // Both should be password type initially
    expect(passInput).toHaveAttribute("type", "password");
    expect(confirmInput).toHaveAttribute("type", "password");

    // Find the toggle buttons (they are the next siblings)
    const passToggleBtn = passInput.nextElementSibling;
    const confirmToggleBtn = confirmInput.nextElementSibling;

    fireEvent.click(passToggleBtn);
    expect(passInput).toHaveAttribute("type", "text");
    fireEvent.click(passToggleBtn);
    expect(passInput).toHaveAttribute("type", "password");

    fireEvent.click(confirmToggleBtn);
    expect(confirmInput).toHaveAttribute("type", "text");
    fireEvent.click(confirmToggleBtn);
    expect(confirmInput).toHaveAttribute("type", "password");
  });
});
