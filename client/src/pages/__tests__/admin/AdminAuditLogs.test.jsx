import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminAuditLogs from "../../admin/AdminAuditLogs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../services", () => ({
  adminService: {
    getAuditLogs: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    error: vi.fn(),
  },
}));

describe("AdminAuditLogs Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLogs = {
    logs: [
      {
        _id: "1",
        timestamp: new Date().toISOString(),
        admin: { name: "Admin 1", role: "superadmin" },
        action: "CREATE_USER",
        details: "Created user John",
        ipAddress: "192.168.1.1",
      },
      {
        _id: "2",
        timestamp: new Date().toISOString(),
        admin: null,
        action: "SYSTEM_JOB",
        details: "Cleaned database",
        ipAddress: "localhost",
      },
    ],
    admins: [
      { _id: "admin1", name: "Admin 1", role: "superadmin" },
      { _id: "admin2", name: "Admin 2", role: "moderator" },
    ],
    totalPages: 3,
  };

  it("renders loading state initially", () => {
    adminService.getAuditLogs.mockReturnValue(new Promise(() => {}));
    render(<AdminAuditLogs />);
    // The table shows an animate-spin during loading
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("fetches and renders logs successfully", async () => {
    adminService.getAuditLogs.mockResolvedValueOnce({ data: mockLogs });
    render(<AdminAuditLogs />);

    await waitFor(() => {
      expect(adminService.getAuditLogs).toHaveBeenCalledWith({
        adminId: "all",
        action: "all",
        startDate: "",
        endDate: "",
        search: "",
        page: 1,
        limit: 15,
      });

      expect(screen.getByText("Created user John")).toBeInTheDocument();
      expect(screen.getByText("System")).toBeInTheDocument(); // For null admin
      expect(screen.getByText("Cleaned database")).toBeInTheDocument();
      expect(screen.getByText("192.168.1.1")).toBeInTheDocument();
    });
  });

  it("renders empty state when no logs", async () => {
    adminService.getAuditLogs.mockResolvedValueOnce({
      data: { logs: [], admins: [], totalPages: 1 },
    });
    render(<AdminAuditLogs />);

    await waitFor(() => {
      expect(screen.getByText("No logs recorded yet")).toBeInTheDocument();
    });
  });

  it("handles search input", async () => {
    adminService.getAuditLogs.mockResolvedValueOnce({ data: mockLogs }); // initial fetch
    render(<AdminAuditLogs />);

    await waitFor(() => {
      expect(screen.getByText("Created user John")).toBeInTheDocument();
    });

    adminService.getAuditLogs.mockClear();
    adminService.getAuditLogs.mockResolvedValueOnce({ data: mockLogs });

    fireEvent.change(screen.getByPlaceholderText(/Search by action/i), {
      target: { value: "Create" },
    });
    fireEvent.click(screen.getByText("Apply Filters"));

    await waitFor(() => {
      expect(adminService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Create",
        }),
      );
    });
  });

  it("handles admin filter", async () => {
    adminService.getAuditLogs.mockResolvedValueOnce({ data: mockLogs });
    render(<AdminAuditLogs />);

    await waitFor(() => {
      expect(screen.getByText("Created user John")).toBeInTheDocument();
    });

    adminService.getAuditLogs.mockClear();
    adminService.getAuditLogs.mockResolvedValueOnce({ data: mockLogs });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "admin1" } });
    fireEvent.click(screen.getByText("Apply Filters"));

    await waitFor(() => {
      expect(adminService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: "admin1",
        }),
      );
    });
  });

  it("handles pagination", async () => {
    adminService.getAuditLogs.mockResolvedValueOnce({ data: mockLogs });
    render(<AdminAuditLogs />);

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    });

    adminService.getAuditLogs.mockClear();
    adminService.getAuditLogs.mockResolvedValueOnce({ data: mockLogs });

    const nextBtn = document.querySelectorAll(".p-2\\.5.rounded-xl")[1]; // Second button is next
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(adminService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        }),
      );
    });

    adminService.getAuditLogs.mockClear();
    adminService.getAuditLogs.mockResolvedValueOnce({ data: mockLogs });

    const prevBtn = document.querySelectorAll(".p-2\\.5.rounded-xl")[0]; // First button is prev
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(adminService.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        }),
      );
    });
  });

  it("handles export to CSV", async () => {
    adminService.getAuditLogs.mockResolvedValueOnce({ data: mockLogs });
    render(<AdminAuditLogs />);

    await waitFor(() => {
      expect(screen.getByText("Created user John")).toBeInTheDocument();
    });

    // Mock createElement and click
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
    };
    const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(mockLink);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => {});

    fireEvent.click(screen.getByText(/Export CSV/i));

    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(mockLink.setAttribute).toHaveBeenCalledWith(
      "href",
      expect.stringContaining("data:text/csv;charset=utf-8"),
    );
    expect(mockLink.setAttribute).toHaveBeenCalledWith(
      "download",
      expect.stringContaining("audit_log_"),
    );
    expect(mockLink.click).toHaveBeenCalled();
    
    createElementSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("handles API error", async () => {
    adminService.getAuditLogs.mockRejectedValueOnce(new Error("Failed"));
    render(<AdminAuditLogs />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch logs");
    });
  });
});
