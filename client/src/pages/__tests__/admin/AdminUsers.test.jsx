import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminUsers from "../../admin/AdminUsers";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";
import { useConfirm } from "../../../context/ConfirmContext";
import { useUrlState } from "../../../hooks/useUrlState";
import useAdminFetch from "../../../hooks/useAdminFetch";

// Mock AdminLayout
vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
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
    },
  };
});

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock window.location.href, URL.createObjectURL, URL.revokeObjectURL
const originalLocation = window.location;
beforeAll(() => {
  delete window.location;
  window.location = { href: "", scrollTo: vi.fn() };
  global.URL.createObjectURL = vi.fn(() => "blob:mock");
  global.URL.revokeObjectURL = vi.fn();
});
afterAll(() => {
  window.location = originalLocation;
});

// Mock services
vi.mock("../../../services", () => ({
  adminService: {
    getUsers: vi.fn(),
    updateUserStatus: vi.fn(),
    deleteContent: vi.fn(),
    impersonateUser: vi.fn(),
    exportUsersCSV: vi.fn(),
    bulkUpdateUserStatus: vi.fn(),
  },
}));

// Mock useAdminFetch hook
vi.mock("../../../hooks/useAdminFetch", () => ({
  __esModule: true,
  default: vi.fn(),
}));

// Mock useUrlState
vi.mock("../../../hooks/useUrlState", () => ({
  useUrlState: vi.fn(),
}));

vi.mock("../../../context/ConfirmContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useConfirm: vi.fn(),
  };
});

// Mock useAdminPermission
vi.mock("../../../hooks/useAdminPermission", () => ({
  __esModule: true,
  default: () => ({
    canManageUsers: true,
    role: "superadmin",
  }),
}));

const mockUsers = [
  {
    _id: "u1",
    name: "John Doe",
    email: "john@example.com",
    status: "active",
    subscription: { plan: "gold" },
    district: "Ahmedabad",
    createdAt: new Date().toISOString(),
    lastLoginDate: new Date().toISOString(),
  },
  {
    _id: "u2",
    name: "Jane Smith",
    email: "jane@example.com",
    status: "suspended",
    subscription: { plan: "free" },
    district: "Surat",
    createdAt: new Date().toISOString(),
    lastLoginDate: null,
  },
];

describe("AdminUsers Page", () => {
  const mockRefetch = vi.fn();
  let mockSetParam, mockSetParams, mockGetParam;
  let mockConfirmFn;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSetParam = vi.fn();
    mockSetParams = vi.fn();
    mockGetParam = vi.fn((key, def) => def);

    useUrlState.mockReturnValue({
      getParam: mockGetParam,
      setParam: mockSetParam,
      setParams: mockSetParams,
    });

    useAdminFetch.mockReturnValue({
      data: { users: mockUsers, total: 2, totalPages: 1 },
      loading: false,
      refetch: mockRefetch,
    });

    mockConfirmFn = vi.fn().mockResolvedValue(true);
    useConfirm.mockReturnValue(mockConfirmFn);

    adminService.updateUserStatus.mockResolvedValue({
      data: { success: true },
    });
    adminService.deleteContent.mockResolvedValue({ data: { success: true } });
    adminService.exportUsersCSV.mockResolvedValue({ data: "csvdata" });
    adminService.bulkUpdateUserStatus.mockResolvedValue({
      data: { message: "Bulk success" },
    });
    adminService.impersonateUser.mockResolvedValue({
      data: { token: "mock-token", user: { _id: "u1" }, message: "Success" },
    });
  });

  it("renders user list correctly", async () => {
    render(<AdminUsers />);

    expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
    expect(screen.getAllByText("jane@example.com")[0]).toBeInTheDocument();
  });

  it("shows loading state", () => {
    useAdminFetch.mockReturnValue({ loading: true });
    render(<AdminUsers />);

    // Check for TableSkeleton by testing one of its potential rendered states or lack of users
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("shows empty state when no users found", () => {
    useAdminFetch.mockReturnValue({
      data: { users: [], total: 0, totalPages: 0 },
      loading: false,
      refetch: mockRefetch,
    });
    render(<AdminUsers />);

    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  it("handles search input", async () => {
    render(<AdminUsers />);

    const searchInput = screen.getByPlaceholderText(/Search by name, email/i);
    fireEvent.change(searchInput, { target: { value: "John" } });

    expect(mockSetParam).toHaveBeenCalledWith("search", "John", {
      debounce: 300,
    });
    expect(mockSetParam).toHaveBeenCalledWith("page", "1");
  });

  it("toggles filters and resets them", async () => {
    // Make hasActiveFilters true
    mockGetParam.mockImplementation((key, def) =>
      key === "district" ? "Surat" : def,
    );

    render(<AdminUsers />);

    const filterBtn = screen.getByRole("button", { name: /Filters/i });
    fireEvent.click(filterBtn);

    const districtSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(districtSelect, { target: { value: "Ahmedabad" } });

    expect(mockSetParams).toHaveBeenCalledWith({
      district: "Ahmedabad",
      page: "1",
    });

    const resetBtn = screen.getByRole("button", { name: /Reset Filters/i });
    fireEvent.click(resetBtn);

    expect(mockSetParams).toHaveBeenCalledWith({
      district: "All",
      plan: "All",
      date: "",
      page: "1",
    });
  });

  it("handles pagination", async () => {
    useAdminFetch.mockReturnValue({
      data: { users: mockUsers, total: 20, totalPages: 2 },
      loading: false,
      refetch: mockRefetch,
    });
    render(<AdminUsers />);

    const nextBtn = screen.getByText("2"); // Page 2 button
    fireEvent.click(nextBtn);

    expect(mockSetParam).toHaveBeenCalledWith("page", "2");
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("handles single user status update", async () => {
    render(<AdminUsers />);

    // John is active, we suspend him
    const suspendBtns = screen.getAllByRole("button", { name: /FiSlash/i });
    fireEvent.click(suspendBtns[0]);

    await waitFor(() => {
      expect(adminService.updateUserStatus).toHaveBeenCalledWith(
        "u1",
        "suspended",
      );
      expect(toast.success).toHaveBeenCalledWith(
        "User status updated to suspended",
      );
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it("handles user deletion", async () => {
    render(<AdminUsers />);

    const deleteBtns = screen.getAllByRole("button", { name: /FiTrash2/i });
    fireEvent.click(deleteBtns[0]);

    expect(mockConfirmFn).toHaveBeenCalled();
    await waitFor(() => {
      expect(adminService.deleteContent).toHaveBeenCalledWith("user", "u1");
      expect(toast.success).toHaveBeenCalledWith("User deleted successfully");
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it("handles impersonation", async () => {
    render(<AdminUsers />);

    const impersonateBtns = screen.getAllByRole("button", { name: /FiUserCheck/i });
    fireEvent.click(impersonateBtns[0]);

    await waitFor(() => {
      expect(toast.loading).toHaveBeenCalledWith("Starting impersonation...", {
        id: "impersonate",
      });
      expect(adminService.impersonateUser).toHaveBeenCalledWith("u1");
      expect(localStorage.getItem("impersonationToken")).toBe("mock-token");
      expect(window.location.href).toBe("/");
    });
  });

  it("handles export CSV", async () => {
    // Mock anchor click
    const mockClick = vi.fn();
    HTMLAnchorElement.prototype.click = mockClick;

    render(<AdminUsers />);

    const exportBtn = screen.getByRole("button", { name: /Export CSV/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(adminService.exportUsersCSV).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Export downloaded!", {
        id: "export",
      });
    });
  });

  it("handles bulk actions selection and execution", async () => {
    render(<AdminUsers />);

    // Select all
    const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(screen.getByText("2 selected")).toBeInTheDocument();
    });

    const bulkSuspendBtn = screen
      .getAllByRole("button", { name: /Suspend/i })
      .find((b) => b.textContent.includes("Suspend"));
    fireEvent.click(bulkSuspendBtn);

    expect(mockConfirmFn).toHaveBeenCalled();
    await waitFor(() => {
      expect(adminService.bulkUpdateUserStatus).toHaveBeenCalledWith(
        ["u1", "u2"],
        "suspended",
      );
      expect(toast.success).toHaveBeenCalledWith("Bulk success");
      expect(mockRefetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByText("2 selected")).not.toBeInTheDocument();
    });
  });

  it("navigates to add admin page", () => {
    render(<AdminUsers />);

    const addBtn = screen.getByRole("button", { name: /Add Admin/i });
    fireEvent.click(addBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/register");
  });

  it("navigates to view user details", () => {
    render(<AdminUsers />);

    const viewBtns = screen.getAllByRole("button", { name: /FiEye/i });
    fireEvent.click(viewBtns[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/user/u1");
  });
});
