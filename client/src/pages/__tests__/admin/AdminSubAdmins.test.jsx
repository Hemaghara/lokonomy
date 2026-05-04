import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminSubAdmins from "../../admin/AdminSubAdmins";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock AdminLayout
vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

// Mock adminService
vi.mock("../../../services", () => ({
  adminService: {
    getSubAdmins: vi.fn(),
    getAdminActivityLogs: vi.fn(),
    deleteSubAdmin: vi.fn(),
    updateSubAdmin: vi.fn(),
    resetSubAdminPassword: vi.fn(),
  },
}));

const mockSubAdmins = [
  {
    _id: "a1",
    name: "Sub Admin One",
    email: "sub1@lokonomy.com",
    role: "Content Moderator",
    permissions: ["Content", "Reports"],
    status: "Active",
    lastActive: new Date().toISOString(),
  },
  {
    _id: "a2",
    name: "Sub Admin Two",
    email: "sub2@lokonomy.com",
    role: "Support Agent",
    permissions: [
      "Support System",
      "User Management",
      "Marketplace",
      "Finance",
    ],
    status: "Inactive",
    lastActive: null,
  },
];

const mockLogs = [
  {
    _id: "l1",
    admin: { name: "Sub Admin One" },
    action: "LOGIN",
    details: "Logged into the system",
    timestamp: new Date().toISOString(),
  },
];

describe("AdminSubAdmins Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
    adminService.getSubAdmins.mockResolvedValue({
      data: { data: mockSubAdmins },
    });
    adminService.getAdminActivityLogs.mockResolvedValue({
      data: { data: mockLogs },
    });
  });

  it("renders sub-admins list and stats", async () => {
    render(<AdminSubAdmins />);

    await waitFor(() => {
      expect(screen.getAllByText("Sub Admin One").length).toBeGreaterThan(0);
      expect(screen.getAllByText("sub1@lokonomy.com").length).toBeGreaterThan(
        0,
      );
      expect(screen.getAllByText("Sub Admin Two").length).toBeGreaterThan(0);
    });
  });

  it("handles loading states", async () => {
    // Delay resolution to check loading state
    adminService.getSubAdmins.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { data: mockSubAdmins } }), 100),
        ),
    );
    render(<AdminSubAdmins />);

    expect(screen.getAllByText("Loading admin data...")[0]).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Sub Admin One").length).toBeGreaterThan(0);
    });
  });

  it("handles API error when fetching sub-admins", async () => {
    adminService.getSubAdmins.mockRejectedValueOnce(new Error("API Error"));
    render(<AdminSubAdmins />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load sub-admins");
    });
  });

  it("handles empty sub-admins list", async () => {
    adminService.getSubAdmins.mockResolvedValueOnce({ data: { data: [] } });
    render(<AdminSubAdmins />);

    await waitFor(() => {
      expect(
        screen.getAllByText("No sub-admins found matching your filters")[0],
      ).toBeInTheDocument();
    });
  });

  it("switches to activity logs tab", async () => {
    render(<AdminSubAdmins />);

    await waitFor(() => screen.getAllByText("Sub Admin One"));

    const logsTab = screen.getAllByRole("button", {
      name: /Activity Logs/i,
    })[0];
    fireEvent.click(logsTab);

    await waitFor(() => {
      expect(
        screen.getAllByText("Recent Administrative Activity")[0],
      ).toBeInTheDocument();
      expect(
        screen.getAllByText("Logged into the system")[0],
      ).toBeInTheDocument();
    });
  });

  it("handles activity logs refresh and empty state", async () => {
    adminService.getAdminActivityLogs.mockResolvedValueOnce({
      data: { data: [] },
    });
    render(<AdminSubAdmins />);

    const logsTab = screen.getAllByRole("button", {
      name: /Activity Logs/i,
    })[0];
    fireEvent.click(logsTab);

    await waitFor(() => {
      expect(
        screen.getAllByText("No activity logs recorded yet")[0],
      ).toBeInTheDocument();
    });

    const refreshBtn = screen.getByText(/Refresh/i);
    fireEvent.click(refreshBtn);
    expect(adminService.getAdminActivityLogs).toHaveBeenCalledTimes(2);
  });

  it("handles API error when fetching logs", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    adminService.getAdminActivityLogs.mockRejectedValueOnce(
      new Error("Logs Error"),
    );
    render(<AdminSubAdmins />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Failed to load logs");
    });
    consoleSpy.mockRestore();
  });

  it("filters by search, role, and status", async () => {
    render(<AdminSubAdmins />);

    await waitFor(() => screen.getAllByText("Sub Admin One"));

    const searchInput = screen.getByPlaceholderText(/Search by name/i);
    fireEvent.change(searchInput, { target: { value: "Admin" } });

    const roleSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(roleSelect, { target: { value: "Content Moderator" } });

    const statusSelect = screen.getAllByRole("combobox")[1];
    fireEvent.change(statusSelect, { target: { value: "Active" } });

    await waitFor(() => {
      expect(adminService.getSubAdmins).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Admin",
          role: "Content Moderator",
          status: "Active",
        }),
      );
    });
  });

  it("navigates to add sub-admin page", async () => {
    render(<AdminSubAdmins />);
    await waitFor(() => screen.getAllByText("Sub Admin One"));

    const addBtn = screen.getByText(/Add Sub-Admin/i);
    fireEvent.click(addBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/sub-admins/create");
  });

  it("navigates to edit sub-admin page", async () => {
    render(<AdminSubAdmins />);
    await waitFor(() => screen.getAllByText("Sub Admin One"));

    const editBtns = screen.getAllByTitle("Edit Admin");
    fireEvent.click(editBtns[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/sub-admins/edit/a1");
  });

  it("deletes sub-admin successfully", async () => {
    adminService.deleteSubAdmin.mockResolvedValueOnce({});
    render(<AdminSubAdmins />);
    await waitFor(() => screen.getAllByText("Sub Admin One"));

    const deleteBtns = screen.getAllByTitle("Delete Admin");
    fireEvent.click(deleteBtns[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this sub-admin?",
    );
    await waitFor(() => {
      expect(adminService.deleteSubAdmin).toHaveBeenCalledWith("a1");
      expect(toast.success).toHaveBeenCalledWith("Sub-admin deleted");
      expect(adminService.getSubAdmins).toHaveBeenCalledTimes(2); // Initial + refetch
    });
  });

  it("cancels sub-admin deletion", async () => {
    window.confirm.mockReturnValueOnce(false);
    render(<AdminSubAdmins />);
    await waitFor(() => screen.getAllByText("Sub Admin One"));

    const deleteBtns = screen.getAllByTitle("Delete Admin");
    fireEvent.click(deleteBtns[0]);

    expect(adminService.deleteSubAdmin).not.toHaveBeenCalled();
  });

  it("handles delete API error", async () => {
    adminService.deleteSubAdmin.mockRejectedValueOnce(
      new Error("Delete Error"),
    );
    render(<AdminSubAdmins />);
    await waitFor(() => screen.getAllByText("Sub Admin One"));

    const deleteBtns = screen.getAllByTitle("Delete Admin");
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to delete sub-admin");
    });
  });

  it("toggles sub-admin status successfully", async () => {
    adminService.updateSubAdmin.mockResolvedValueOnce({});
    render(<AdminSubAdmins />);
    await waitFor(() => screen.getAllByText("Sub Admin One"));

    // Sub Admin One is Active, clicking will Disable
    const disableBtns = screen.getAllByTitle("Disable Account");
    fireEvent.click(disableBtns[0]);

    await waitFor(() => {
      expect(adminService.updateSubAdmin).toHaveBeenCalledWith("a1", {
        status: "Inactive",
      });
      expect(toast.success).toHaveBeenCalledWith("Account Disabled");
      expect(adminService.getSubAdmins).toHaveBeenCalledTimes(2);
    });

    // Sub Admin Two is Inactive, clicking will Enable
    adminService.updateSubAdmin.mockResolvedValueOnce({});
    const enableBtns = screen.getAllByTitle("Enable Account");
    fireEvent.click(enableBtns[0]);

    await waitFor(() => {
      expect(adminService.updateSubAdmin).toHaveBeenCalledWith("a2", {
        status: "Active",
      });
      expect(toast.success).toHaveBeenCalledWith("Account Enabled");
    });
  });

  it("handles toggle status API error", async () => {
    adminService.updateSubAdmin.mockRejectedValueOnce(
      new Error("Toggle Error"),
    );
    render(<AdminSubAdmins />);
    await waitFor(() => screen.getAllByText("Sub Admin One"));

    const disableBtns = screen.getAllByTitle("Disable Account");
    fireEvent.click(disableBtns[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update status");
    });
  });

  it("handles reset password flow successfully", async () => {
    adminService.resetSubAdminPassword.mockResolvedValueOnce({});
    render(<AdminSubAdmins />);
    await waitFor(() => screen.getAllByText("Sub Admin One"));

    const resetBtns = screen.getAllByTitle("Reset Password");
    fireEvent.click(resetBtns[0]);

    // Modal should appear
    await waitFor(() => {
      expect(screen.getAllByText("Password")[0]).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText("Enter new password");
    fireEvent.change(passwordInput, { target: { value: "newsecurepassword" } });

    const updateBtn = screen.getByText("Update Now");
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(adminService.resetSubAdminPassword).toHaveBeenCalledWith(
        "a1",
        "newsecurepassword",
      );
      expect(toast.success).toHaveBeenCalledWith("Password reset successfully");
    });
  });

  it("shows error if resetting password without input", async () => {
    render(<AdminSubAdmins />);
    await waitFor(() => screen.getAllByText("Sub Admin One"));

    const resetBtns = screen.getAllByTitle("Reset Password");
    fireEvent.click(resetBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Update Now")).toBeInTheDocument();
    });

    const updateBtn = screen.getByText("Update Now");
    fireEvent.click(updateBtn);

    expect(toast.error).toHaveBeenCalledWith("Please enter a new password");
    expect(adminService.resetSubAdminPassword).not.toHaveBeenCalled();
  });

  it("handles reset password API error", async () => {
    adminService.resetSubAdminPassword.mockRejectedValueOnce(
      new Error("Reset Error"),
    );
    render(<AdminSubAdmins />);
    await waitFor(() => screen.getAllByText("Sub Admin One"));

    const resetBtns = screen.getAllByTitle("Reset Password");
    fireEvent.click(resetBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Update Now")).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText("Enter new password");
    fireEvent.change(passwordInput, { target: { value: "newsecurepassword" } });

    const updateBtn = screen.getByText("Update Now");
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to reset password");
    });
  });

  it("cancels reset password modal", async () => {
    render(<AdminSubAdmins />);
    await waitFor(() => screen.getAllByText("Sub Admin One"));

    const resetBtns = screen.getAllByTitle("Reset Password");
    fireEvent.click(resetBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    const cancelBtn = screen.getByText("Cancel");
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Enter new password"),
      ).not.toBeInTheDocument();
    });
  });
});
