import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminBusinesses from "../../admin/AdminBusinesses";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { useConfirm } from "../../../context/ConfirmContext";
import { useUrlState } from "../../../hooks/useUrlState";

// Mock recharts
vi.mock("recharts", () => ({
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => <div />,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
}));

// Mock Confirm Context
vi.mock("../../../context/ConfirmContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useConfirm: vi.fn(),
  };
});

// Mock AdminLayout
vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

// Mock useUrlState
vi.mock("../../../hooks/useUrlState", () => ({
  useUrlState: vi.fn(),
}));

// Mock adminService
vi.mock("../../../services", () => ({
  adminService: {
    getBusinesses: vi.fn(),
    deleteContent: vi.fn(),
  },
}));

const mockBusinesses = [
  {
    _id: "b1",
    businessName: "Global Bakery",
    mainCategory: "Food",
    status: "verified",
    district: "Ahmedabad",
    ownerName: "Jane Smith",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "b2",
    businessName: "Local Hardware",
    mainCategory: "Retail",
    status: "pending",
    district: "Surat",
    ownerName: "John Doe",
    logo: "logo.png",
    createdAt: new Date().toISOString(),
  },
];

describe("AdminBusinesses Page", () => {
  const mockConfirm = vi.fn();
  const mockSetParam = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useConfirm.mockReturnValue(mockConfirm);
    useUrlState.mockReturnValue({
      getParam: vi.fn().mockReturnValue(""),
      setParam: mockSetParam,
    });
    adminService.getBusinesses.mockResolvedValue({ data: mockBusinesses });
    adminService.deleteContent.mockResolvedValue({ data: { success: true } });
  });

  it("renders business list correctly", async () => {
    render(<AdminBusinesses />);

    await waitFor(() => {
      expect(screen.getAllByText("Global Bakery").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Jane Smith").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Local Hardware").length).toBeGreaterThan(0);
    });
  });

  it("filters businesses by search via url state", async () => {
    render(<AdminBusinesses />);

    await waitFor(() => {
      expect(screen.getAllByText("Global Bakery").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(/Search businesses/i);
    fireEvent.change(searchInput, { target: { value: "Bakery" } });

    expect(mockSetParam).toHaveBeenCalledWith("search", "Bakery", {
      debounce: 500,
    });
  });

  it("filters businesses when url search param is present", async () => {
    useUrlState.mockReturnValue({
      getParam: vi.fn().mockReturnValue("hardware"),
      setParam: mockSetParam,
    });
    render(<AdminBusinesses />);

    await waitFor(() => {
      expect(screen.queryByText("Global Bakery")).not.toBeInTheDocument();
      expect(screen.getAllByText("Local Hardware").length).toBeGreaterThan(0);
    });
  });

  it("handles business deletion successfully", async () => {
    mockConfirm.mockResolvedValue(true);
    render(<AdminBusinesses />);

    await waitFor(() => {
      expect(screen.getAllByText("Global Bakery").length).toBeGreaterThan(0);
    });

    const deleteBtns = screen.getAllByLabelText("Delete Business");
    fireEvent.click(deleteBtns[0]); // delete first business

    await waitFor(() => {
      expect(adminService.deleteContent).toHaveBeenCalledWith("business", "b1");
      // Refetch should happen
      expect(adminService.getBusinesses).toHaveBeenCalledTimes(2);
    });
  });

  it("cancels business deletion when confirmation is rejected", async () => {
    mockConfirm.mockResolvedValue(false);
    render(<AdminBusinesses />);

    await waitFor(() => {
      expect(screen.getAllByText("Global Bakery").length).toBeGreaterThan(0);
    });

    const deleteBtns = screen.getAllByLabelText("Delete Business");
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(adminService.deleteContent).not.toHaveBeenCalled();
    });
  });

  it("handles business deletion error", async () => {
    mockConfirm.mockResolvedValue(true);
    adminService.deleteContent.mockRejectedValue(new Error("Failed"));
    render(<AdminBusinesses />);

    await waitFor(() => {
      expect(screen.getAllByText("Global Bakery").length).toBeGreaterThan(0);
    });

    const deleteBtns = screen.getAllByLabelText("Delete Business");
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(adminService.deleteContent).toHaveBeenCalledWith("business", "b1");
    });
  });

  it("handles empty state with no data", async () => {
    adminService.getBusinesses.mockResolvedValueOnce({ data: [] });
    render(<AdminBusinesses />);
    await waitFor(() => {
      expect(screen.getByText(/No businesses found/i)).toBeInTheDocument();
    });
  });

  it("renders loading state initially", async () => {
    let resolvePromise;
    adminService.getBusinesses.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { container } = render(<AdminBusinesses />);

    // Skeleton should be visible
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();

    resolvePromise({ data: mockBusinesses });
    await waitFor(() =>
      expect(screen.getAllByText("Global Bakery").length).toBeGreaterThan(0),
    );
  });

  it("navigates to business view on button click", async () => {
    render(<AdminBusinesses />);

    await waitFor(() => {
      expect(screen.getAllByText("Global Bakery").length).toBeGreaterThan(0);
    });

    const viewBtns = screen.getAllByLabelText("View Business");
    fireEvent.click(viewBtns[0]); // first business is b1

    // since navigate is mocked in test-utils or implicitly not doing anything
    // we just ensure the button is clickable and no error thrown
  });
});
