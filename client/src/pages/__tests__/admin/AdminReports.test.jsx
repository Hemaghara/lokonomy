import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminReports from "../../admin/AdminReports";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

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

vi.mock("../../../services", () => ({
  adminService: { exportExcel: vi.fn() },
}));

vi.mock("react-icons/fi", () => ({
  FiDownload: () => <span />,
  FiFileText: () => <span />,
  FiUsers: () => <span />,
  FiShoppingBag: () => <span />,
  FiBriefcase: () => <span />,
  FiPieChart: () => <span />,
}));

describe("AdminReports Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.exportExcel.mockResolvedValue({
      data: new Blob(["mock"], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    });
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("renders reporting center header", () => {
    render(<AdminReports />);
    expect(screen.getByText("Reporting Center")).toBeDefined();
    expect(
      screen.getByText(/Generate and download comprehensive Excel reports/i),
    ).toBeDefined();
  });

  it("renders all three report cards", () => {
    render(<AdminReports />);
    expect(screen.getAllByText(/User Directory/i)[0]).toBeDefined();
    expect(screen.getAllByText(/Sales & Orders/i)[0]).toBeDefined();
    expect(screen.getAllByText(/Business Registry/i)[0]).toBeDefined();
  });

  it("renders report descriptions", () => {
    render(<AdminReports />);
    expect(screen.getByText(/Full list of registered users/i)).toBeDefined();
    expect(screen.getByText(/Detailed transaction history/i)).toBeDefined();
    expect(
      screen.getByText(/Catalog of all registered businesses/i),
    ).toBeDefined();
  });

  it("renders three download buttons", () => {
    render(<AdminReports />);
    expect(
      screen.getAllByRole("button", { name: /Download Excel/i }).length,
    ).toBe(3);
  });

  it("renders custom date range info section", () => {
    render(<AdminReports />);
    expect(screen.getByText("Custom Date Range?")).toBeDefined();
  });

  it("renders within AdminLayout", () => {
    render(<AdminReports />);
    expect(screen.getByTestId("admin-layout")).toBeDefined();
  });

  it("exports user report on click", async () => {
    render(<AdminReports />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[0],
    );
    await waitFor(() => {
      expect(adminService.exportExcel).toHaveBeenCalledWith("users");
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it("shows success toast for user report", async () => {
    render(<AdminReports />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[0],
    );
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("users report exported");
    });
  });

  it("exports orders report on click", async () => {
    render(<AdminReports />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[1],
    );
    await waitFor(() => {
      expect(adminService.exportExcel).toHaveBeenCalledWith("orders");
    });
  });

  it("shows success toast for orders report", async () => {
    render(<AdminReports />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[1],
    );
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("orders report exported");
    });
  });

  it("exports business report on click", async () => {
    render(<AdminReports />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[2],
    );
    await waitFor(() => {
      expect(adminService.exportExcel).toHaveBeenCalledWith("businesses");
    });
  });

  it("shows success toast for businesses report", async () => {
    render(<AdminReports />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[2],
    );
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("businesses report exported");
    });
  });

  it("disables all buttons while downloading", async () => {
    adminService.exportExcel.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: new Blob() }), 150),
        ),
    );
    render(<AdminReports />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[0],
    );
    expect(
      screen.getAllByRole("button", { name: /Download Excel/i })[0],
    ).toBeDisabled();
    await waitFor(() => {
      const disabled = screen
        .getAllByRole("button", { name: /Download Excel/i })
        .filter((b) => b.disabled);
      expect(disabled.length).toBe(0);
    });
  });

  it("shows error toast when user report fails", async () => {
    adminService.exportExcel.mockRejectedValueOnce(new Error("fail"));
    render(<AdminReports />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[0],
    );
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to export users report");
    });
  });

  it("shows error toast when orders report fails", async () => {
    adminService.exportExcel.mockRejectedValueOnce(new Error("fail"));
    render(<AdminReports />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[1],
    );
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to export orders report",
      );
    });
  });

  it("shows error toast when business report fails", async () => {
    adminService.exportExcel.mockRejectedValueOnce(new Error("fail"));
    render(<AdminReports />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[2],
    );
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to export businesses report",
      );
    });
  });

  it("re-enables buttons after failed export", async () => {
    adminService.exportExcel.mockRejectedValueOnce(new Error("fail"));
    render(<AdminReports />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[0],
    );
    await waitFor(() => {
      const disabled = screen
        .getAllByRole("button", { name: /Download Excel/i })
        .filter((b) => b.disabled);
      expect(disabled.length).toBe(0);
    });
  });

  it("allows sequential downloads", async () => {
    render(<AdminReports />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[0],
    );
    await waitFor(() =>
      expect(adminService.exportExcel).toHaveBeenCalledWith("users"),
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: /Download Excel/i })[1],
    );
    await waitFor(() =>
      expect(adminService.exportExcel).toHaveBeenCalledWith("orders"),
    );
  });
});
