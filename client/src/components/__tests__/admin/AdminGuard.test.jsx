import { render, screen, waitFor } from "../../../utils/test-utils";
import AdminGuard from "../../admin/AdminGuard";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useAdminPermission from "../../../hooks/useAdminPermission";
import { toast } from "react-hot-toast";
import { Route, Routes } from "react-router-dom";

vi.mock("../../../hooks/useAdminPermission", () => ({
  default: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}));

describe("AdminGuard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui) => {
    return render(
      <Routes>
        <Route path="/guarded" element={ui} />
        <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
      </Routes>,
      { initialEntries: ["/guarded"] },
    );
  };

  it("renders children if authorized (canManageUsers)", () => {
    useAdminPermission.mockReturnValue({ canManageUsers: true });

    renderWithRouter(
      <AdminGuard permission="canManageUsers">
        <div>Guarded Content</div>
      </AdminGuard>,
    );

    expect(screen.getByText("Guarded Content")).toBeInTheDocument();
  });

  it("renders children if authorized (canManageBusinesses)", () => {
    useAdminPermission.mockReturnValue({ canManageBusinesses: true });

    renderWithRouter(
      <AdminGuard permission="canManageBusinesses">
        <div>Business Management</div>
      </AdminGuard>,
    );

    expect(screen.getByText("Business Management")).toBeInTheDocument();
  });

  it("redirects to dashboard and shows toast if unauthorized", async () => {
    useAdminPermission.mockReturnValue({ canManageUsers: false });

    renderWithRouter(
      <AdminGuard permission="canManageUsers">
        <div>Guarded Content</div>
      </AdminGuard>,
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Access Denied: You do not have permission to view this page.",
      );
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });
  });

  it("renders children if no permission specified", () => {
    useAdminPermission.mockReturnValue({ canManageUsers: false }); // Even if false, it should pass if no permission prop

    renderWithRouter(
      <AdminGuard>
        <div>Guarded Content</div>
      </AdminGuard>,
    );

    expect(screen.getByText("Guarded Content")).toBeInTheDocument();
  });

  it("handles undefined permissions gracefully", async () => {
    useAdminPermission.mockReturnValue({}); // Empty permissions

    renderWithRouter(
      <AdminGuard permission="nonExistentPermission">
        <div>Guarded Content</div>
      </AdminGuard>,
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });
  });
});
