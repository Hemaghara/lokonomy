import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import CreateSubAdmin from "../../admin/CreateSubAdmin";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// Mock layouts
vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

// Mock services
vi.mock("../../../services", () => ({
  adminService: {
    getSubAdminById: vi.fn(),
    createSubAdmin: vi.fn(),
    updateSubAdmin: vi.fn(),
  },
}));

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

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(() => mockNavigate),
  };
});

describe("CreateSubAdmin Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useParams.mockReturnValue({});
  });

  it("renders creation form by default", () => {
    render(<CreateSubAdmin />);

    expect(screen.getByText(/Create Sub-/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Full Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Account Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Deploy Admin/i }),
    ).toBeInTheDocument();
  });

  it("handles input changes correctly", () => {
    render(<CreateSubAdmin />);

    const nameInput = screen.getByPlaceholderText("Full Name");
    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Account Password");

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(nameInput.value).toBe("John Doe");
    expect(emailInput.value).toBe("john@example.com");
    expect(passwordInput.value).toBe("password123");
  });

  it("changes permissions when selecting a role preset", async () => {
    render(<CreateSubAdmin />);

    // Default role is Content Moderator
    // Check if Content permission is active (using class check as per component logic)
    const contentPermBtn = screen.getByRole("button", { name: /^Content$/i });
    expect(contentPermBtn.className).toContain("bg-indigo-600/10");

    // Change to Support Agent
    const supportAgentBtn = screen.getByRole("button", {
      name: /Support Agent/i,
    });
    fireEvent.click(supportAgentBtn);

    // Support Agent preset: ["Support System", "User Management"]
    const supportSystemBtn = screen.getByRole("button", {
      name: /Support System/i,
    });
    const userMgmtBtn = screen.getByRole("button", {
      name: /User Management/i,
    });

    expect(supportSystemBtn.className).toContain("bg-indigo-600/10");
    expect(userMgmtBtn.className).toContain("bg-indigo-600/10");
    expect(contentPermBtn.className).not.toContain("bg-indigo-600/10");
  });

  it("toggles permissions manually", () => {
    render(<CreateSubAdmin />);

    const financeBtn = screen.getByRole("button", { name: /^Finance$/i });

    // Initially not active
    expect(financeBtn.className).not.toContain("bg-indigo-600/10");

    // Click to activate
    fireEvent.click(financeBtn);
    expect(financeBtn.className).toContain("bg-indigo-600/10");

    // Click to deactivate
    fireEvent.click(financeBtn);
    expect(financeBtn.className).not.toContain("bg-indigo-600/10");
  });

  it("submits creation form successfully", async () => {
    adminService.createSubAdmin.mockResolvedValue({ data: { success: true } });

    render(<CreateSubAdmin />);

    fireEvent.change(screen.getByPlaceholderText("Full Name"), {
      target: { value: "New Admin" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { value: "admin@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Account Password"), {
      target: { value: "secure123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Deploy Admin/i }));

    await waitFor(() => {
      expect(adminService.createSubAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Admin",
          email: "admin@test.com",
          password: "secure123",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Sub-admin created successfully",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/admin/sub-admins");
    });
  });

  it("handles creation failure", async () => {
    adminService.createSubAdmin.mockRejectedValue({
      response: { data: { message: "Email already exists" } },
    });

    render(<CreateSubAdmin />);

    fireEvent.change(screen.getByPlaceholderText("Full Name"), {
      target: { value: "Bad Admin" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { value: "error@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Account Password"), {
      target: { value: "password" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Deploy Admin/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email already exists");
    });
  });

  it("renders edit mode and fetches details when ID is present", async () => {
    useParams.mockReturnValue({ id: "123" });
    const mockAdmin = {
      name: "Existing Admin",
      email: "existing@test.com",
      role: "Finance Manager",
      permissions: ["Finance", "Transactions"],
      status: "Active",
    };
    adminService.getSubAdminById.mockResolvedValue({
      data: { data: mockAdmin },
    });

    render(<CreateSubAdmin />);

    expect(screen.getByText(/Edit Sub-/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Admin")).toBeInTheDocument();
      expect(screen.getByDisplayValue("existing@test.com")).toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText("Account Password"),
      ).not.toBeInTheDocument();

      const financeBtn = screen.getByRole("button", { name: /^Finance$/i });
      expect(financeBtn.className).toContain("bg-indigo-600/10");
    });
  });

  it("submits update form successfully", async () => {
    useParams.mockReturnValue({ id: "123" });
    adminService.getSubAdminById.mockResolvedValue({
      data: {
        data: {
          name: "Old Name",
          email: "old@test.com",
          role: "admin",
          permissions: [],
          status: "Active",
        },
      },
    });
    adminService.updateSubAdmin.mockResolvedValue({ data: { success: true } });

    render(<CreateSubAdmin />);

    await waitFor(() => screen.getByDisplayValue("Old Name"));

    fireEvent.change(screen.getByDisplayValue("Old Name"), {
      target: { value: "Updated Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Account/i }));

    await waitFor(() => {
      expect(adminService.updateSubAdmin).toHaveBeenCalledWith(
        "123",
        expect.objectContaining({
          name: "Updated Name",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Sub-admin updated successfully",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/admin/sub-admins");
    });
  });

  it("handles fetch failure for edit mode", async () => {
    useParams.mockReturnValue({ id: "123" });
    adminService.getSubAdminById.mockRejectedValue(new Error("Fetch failed"));

    render(<CreateSubAdmin />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to load sub-admin details",
      );
    });
  });

  it("navigates back to list when back button is clicked", () => {
    render(<CreateSubAdmin />);

    fireEvent.click(screen.getByText(/Back to List/i));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/sub-admins");
  });

  it("navigates back to list when discard button is clicked", () => {
    render(<CreateSubAdmin />);

    fireEvent.click(screen.getByText(/Discard Changes/i));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/sub-admins");
  });

  it("checks for required fields in form", () => {
    render(<CreateSubAdmin />);

    const nameInput = screen.getByPlaceholderText("Full Name");
    const emailInput = screen.getByPlaceholderText("Email Address");
    const passwordInput = screen.getByPlaceholderText("Account Password");

    expect(nameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});
