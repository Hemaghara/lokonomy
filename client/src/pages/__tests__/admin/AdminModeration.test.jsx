import React from "react";
import { render, screen, fireEvent, waitFor, within } from "../../../utils/test-utils";
import AdminModeration from "../../admin/AdminModeration";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";
import { useConfirm } from "../../../context/ConfirmContext";

vi.mock("../../services/pushService", () => ({
  subscribeToPush: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../layouts/AdminLayout", () => ({
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

vi.mock("../../../components/admin/AdminErrorBoundary", () => ({
  default: ({ children }) => <>{children}</>,
}));

const mockLogin = vi.fn();
vi.mock("../../context/UserContext", () => ({
  useUser: () => ({
    login: mockLogin,
    user: null,
  }),
}));

vi.mock("../../../services", () => ({
  adminService: {
    getModerationReports: vi.fn(),
    getReportedContent: vi.fn(),
    resolveReport: vi.fn(),
  },
}));

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('react-hot-toast', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toast: mockToast,
  };
});

const mockConfirm = vi.hoisted(() => vi.fn());
vi.mock("../../../context/ConfirmContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useConfirm: () => mockConfirm,
  };
});

const mockReportsData = {
  data: {
    reports: [
      {
        _id: "r1",
        targetType: "product",
        targetId: "PRD12345",
        reason: "Inappropriate Content",
        description: "Contains offensive images",
        status: "pending",
        createdAt: new Date().toISOString(),
        reportedBy: { name: "User 1" },
      },
      {
        _id: "r2",
        targetType: "job",
        targetId: "job98765",
        reason: "Spam",
        description: "Duplicate job posting",
        status: "pending",
        createdAt: new Date().toISOString(),
        reportedBy: { name: "User 2" },
      },
    ],
  },
};

describe("AdminModeration Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReset();
    mockConfirm.mockResolvedValue(true); // Default confirm to true
  });

  it("renders loading state initially", () => {
    adminService.getModerationReports.mockReturnValue(new Promise(() => {}));
    render(<AdminModeration />);
    expect(screen.getByText("Moderation Center")).toBeInTheDocument();
  });

  it("fetches and displays reports", async () => {
    adminService.getModerationReports.mockResolvedValue(mockReportsData);

    render(<AdminModeration />);

    await waitFor(() => {
      expect(adminService.getModerationReports).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('"Inappropriate Content"')).toBeInTheDocument();
    expect(screen.getByText("Contains offensive images")).toBeInTheDocument();
    expect(screen.getByText('"Spam"')).toBeInTheDocument();

    expect(await screen.findByText(/PRD12345/)).toBeInTheDocument();
    expect(screen.getByText(/User 1/i)).toBeInTheDocument();
  });

  it("handles empty state", async () => {
    adminService.getModerationReports.mockResolvedValue({
      data: { reports: [] },
    });

    render(<AdminModeration />);

    await screen.findByText("No pending reports");
  });

  it("handles filtering by status", async () => {
    adminService.getModerationReports.mockResolvedValue(mockReportsData);

    render(<AdminModeration />);
    await screen.findByText('"Inappropriate Content"');

    const resolvedBtn = screen.getByRole("button", { name: /^resolved$/i });
    fireEvent.click(resolvedBtn);

    await waitFor(() => {
      expect(adminService.getModerationReports).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "resolved",
        }),
      );
    });
  });

  it("handles selection of single and multiple reports", async () => {
    adminService.getModerationReports.mockResolvedValue(mockReportsData);

    render(<AdminModeration />);
    await screen.findByText('"Inappropriate Content"');

    // Select first report
    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is "Select All"
    fireEvent.click(checkboxes[1]);

    expect(screen.getByText("1 selected")).toBeInTheDocument();

    // Select All
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    // Deselect All
    fireEvent.click(checkboxes[0]);
    expect(screen.queryByText("selected")).not.toBeInTheDocument();
  });

  it("handles single resolve actions", async () => {
    adminService.getModerationReports.mockResolvedValue(mockReportsData);
    adminService.resolveReport.mockResolvedValue({});

    render(<AdminModeration />);
    await screen.findByText('"Inappropriate Content"');

    // Warn
    const warnBtns = screen.getAllByRole("button", { name: /Warn/i });
    fireEvent.click(warnBtns[0]);

    expect(mockConfirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(adminService.resolveReport).toHaveBeenCalledWith("r1", {
        action: "warned",
        status: "resolved",
      });
      expect(toast.success).toHaveBeenCalledWith("Report resolved");
      expect(adminService.getModerationReports).toHaveBeenCalledTimes(2);
    });

    // Cancel action
    mockConfirm.mockResolvedValueOnce(false);
    const dismissBtns = screen.getAllByRole("button", { name: /Dismiss/i });
    // First dismiss button is for r1
    fireEvent.click(dismissBtns[0]);

    await waitFor(() => {
      // Should not be called again
      expect(adminService.resolveReport).toHaveBeenCalledTimes(1);
    });
  });

  it("handles bulk resolve actions", async () => {
    adminService.getModerationReports.mockResolvedValue(mockReportsData);
    adminService.resolveReport.mockResolvedValue({});

    render(<AdminModeration />);
    await screen.findByText('"Inappropriate Content"');

    // Select All
    const selectAll = screen.getAllByRole("checkbox")[0];
    fireEvent.click(selectAll);

    expect(screen.getByText("2 selected")).toBeInTheDocument();

    // Bulk Delete
    const deleteAllBtn = screen.getByRole("button", { name: /Delete All/i });
    fireEvent.click(deleteAllBtn);
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());

    expect(mockConfirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(adminService.resolveReport).toHaveBeenCalledWith("r1", {
        action: "removed",
        status: "resolved",
      });
      expect(adminService.resolveReport).toHaveBeenCalledWith("r2", {
        action: "removed",
        status: "resolved",
      });
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("2 reports resolved");
      expect(adminService.getModerationReports).toHaveBeenCalledTimes(2);
    });
  });

  it("opens and loads content preview", async () => {
    adminService.getModerationReports.mockResolvedValue(mockReportsData);
    adminService.getReportedContent.mockResolvedValue({
      data: {
        targetType: "product",
        content: {
          title: "Offensive Product",
          description: "Bad content here",
        },
      },
    });

    render(<AdminModeration />);
    await screen.findByText('"Inappropriate Content"');

    // Click preview button on the first report
    const viewBtns = screen.getAllByRole("button", {
      name: /Preview content/i,
    });
    fireEvent.click(viewBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/product Preview/i)).toBeInTheDocument();
      expect(screen.getByText("Offensive Product")).toBeInTheDocument();
      expect(screen.getByText("Bad content here")).toBeInTheDocument();
    });

    // Close preview
    const closeBtn = screen.getByRole("button", { name: /Close preview/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText("Offensive Product")).not.toBeInTheDocument();
  });

  it("handles content preview failure or deleted content", async () => {
    adminService.getModerationReports.mockResolvedValue(mockReportsData);
    adminService.getReportedContent.mockRejectedValue(
      new Error("Content missing"),
    );

    render(<AdminModeration />);
    await screen.findByText('"Inappropriate Content"');

    const viewBtns = screen.getAllByRole("button", {
      name: /Preview content/i,
    });
    fireEvent.click(viewBtns[0]);

    await waitFor(() => {
      expect(
        screen.getByText("Content has been removed or is unavailable."),
      ).toBeInTheDocument();
    });
  });
});
