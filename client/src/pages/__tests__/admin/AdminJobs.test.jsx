import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminJobs from "../../admin/AdminJobs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, custom, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../services", () => ({
  adminService: {
    getJobs: vi.fn(),
    getJobStats: vi.fn(),
    toggleBanJob: vi.fn(),
    toggleSuspendJob: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockStatsData = {
  data: {
    totalJobs: 150,
    openJobs: 100,
    closedJobs: 30,
    bannedJobs: 10,
    suspendedJobs: 10,
    totalApplications: 500,
  },
};

const mockJobsData = {
  data: {
    jobs: [
      {
        _id: "job1",
        position: "Software Engineer",
        location: "Remote",
        district: "Tech Hub",
        salary: "₹50,000",
        vacancies: 3,
        education: "B.Tech",
        status: "Open",
        isFlagged: false,
        isSuspended: false,
        posterName: "Acme Corp",
        posterId: { subscription: { plan: "gold" } },
        applications: [1, 2],
      },
      {
        _id: "job2",
        position: "Data Analyst",
        location: "Office",
        district: "City Center",
        salary: "₹40,000",
        vacancies: 1,
        education: "Graduate",
        status: "Closed",
        isFlagged: true,
        isSuspended: true,
        posterName: "Data Inc",
        posterId: { subscription: { plan: "free" } },
        applications: [],
      },
    ],
    totalPages: 2,
  },
};

describe("AdminJobs Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    adminService.getJobs.mockReturnValue(new Promise(() => {}));
    adminService.getJobStats.mockReturnValue(new Promise(() => {}));
    render(<AdminJobs />);

    expect(screen.getByText("Job")).toBeInTheDocument();
    expect(screen.getByText("Loading jobs…")).toBeInTheDocument();
  });

  it("fetches and displays stats and jobs", async () => {
    adminService.getJobStats.mockResolvedValue(mockStatsData);
    adminService.getJobs.mockResolvedValue(mockJobsData);

    render(<AdminJobs />);

    await waitFor(() => {
      expect(adminService.getJobStats).toHaveBeenCalledTimes(1);
      expect(adminService.getJobs).toHaveBeenCalledTimes(1);
    });

    // Stats
    expect(screen.getByText("150")).toBeInTheDocument(); // Total Jobs
    expect(screen.getByText("100")).toBeInTheDocument(); // Open
    expect(screen.getByText("30")).toBeInTheDocument(); // Closed
    expect(screen.getByText("500")).toBeInTheDocument(); // Applications

    // Jobs list
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Data Analyst")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();

    // Pagination
    expect(screen.getByText("/ 2")).toBeInTheDocument(); // total 2
  });

  it("handles search input", async () => {
    adminService.getJobStats.mockResolvedValue(mockStatsData);
    adminService.getJobs.mockResolvedValue(mockJobsData);

    render(<AdminJobs />);
    await screen.findByText("Software Engineer");

    const searchInput = screen.getByLabelText(/Search Jobs/i);
    fireEvent.change(searchInput, { target: { value: "software" } });

    await waitFor(() => {
      // It should call getJobs with the new search parameter
      expect(adminService.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "software",
        }),
      );
    });
  });

  it("handles status filtering", async () => {
    adminService.getJobStats.mockResolvedValue(mockStatsData);
    adminService.getJobs.mockResolvedValue(mockJobsData);

    render(<AdminJobs />);
    await screen.findByText("Software Engineer");

    const openBtn = screen.getByRole("button", { name: /^open$/i });
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(adminService.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "open",
          page: 1,
        }),
      );
    });
  });

  it("handles education filtering", async () => {
    adminService.getJobStats.mockResolvedValue(mockStatsData);
    adminService.getJobs.mockResolvedValue(mockJobsData);

    render(<AdminJobs />);
    await screen.findByText("Software Engineer");

    const gradBtn = screen.getByRole("button", { name: /^Graduate$/i });
    fireEvent.click(gradBtn);

    await waitFor(() => {
      expect(adminService.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          education: "Graduate",
          page: 1,
        }),
      );
    });
  });

  it("handles pagination", async () => {
    adminService.getJobStats.mockResolvedValue(mockStatsData);
    adminService.getJobs.mockResolvedValue(mockJobsData);

    render(<AdminJobs />);
    await screen.findByText("Software Engineer");

    const nextBtn = screen.getByLabelText(/Next Page/i);
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(adminService.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        }),
      );
    });
  });

  it("handles navigate to job details when card or view button is clicked", async () => {
    adminService.getJobStats.mockResolvedValue(mockStatsData);
    adminService.getJobs.mockResolvedValue(mockJobsData);

    render(<AdminJobs />);
    await screen.findByText("Software Engineer");

    // Click the card (first element)
    const card = screen
      .getByText("Software Engineer")
      .closest("div").parentElement;
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/jobs/job1");
  });

  it("handles empty state", async () => {
    adminService.getJobStats.mockResolvedValue(mockStatsData);
    adminService.getJobs.mockResolvedValue({
      data: { jobs: [], totalPages: 1 },
    });

    render(<AdminJobs />);
    await screen.findByText("No jobs found matching your filters");
  });

  it("toggles ban status successfully", async () => {
    adminService.getJobStats.mockResolvedValue(mockStatsData);
    adminService.getJobs.mockResolvedValue(mockJobsData);
    adminService.toggleBanJob.mockResolvedValue({
      data: { message: "Ban toggled" },
    });

    render(<AdminJobs />);
    await screen.findByText("Software Engineer");

    // Use aria-label
    const banButtons = screen.getAllByLabelText("Ban Job");
    fireEvent.click(banButtons[0]); // job1 is not flagged, so it says "Ban Job"

    await waitFor(() => {
      expect(adminService.toggleBanJob).toHaveBeenCalledWith("job1");
      expect(toast.success).toHaveBeenCalledWith("Ban toggled");
      // Should refetch
      expect(adminService.getJobs).toHaveBeenCalledTimes(2);
    });
  });

  it("toggles suspend status successfully", async () => {
    adminService.getJobStats.mockResolvedValue(mockStatsData);
    adminService.getJobs.mockResolvedValue(mockJobsData);
    adminService.toggleSuspendJob.mockResolvedValue({
      data: { message: "Suspend toggled" },
    });

    render(<AdminJobs />);
    await screen.findByText("Software Engineer");

    // First job is not suspended, so its button is "Suspend Job"
    const suspendButtons = screen.getAllByLabelText("Suspend Job");
    fireEvent.click(suspendButtons[0]);

    await waitFor(() => {
      expect(adminService.toggleSuspendJob).toHaveBeenCalledWith("job1");
      expect(toast.success).toHaveBeenCalledWith("Suspend toggled");
      expect(adminService.getJobs).toHaveBeenCalledTimes(2);
    });
  });

  it("handles toggle errors", async () => {
    adminService.getJobStats.mockResolvedValue(mockStatsData);
    adminService.getJobs.mockResolvedValue(mockJobsData);
    adminService.toggleBanJob.mockRejectedValue(new Error("API error"));

    render(<AdminJobs />);
    await screen.findByText("Software Engineer");

    const banButtons = screen.getAllByLabelText("Ban Job");
    fireEvent.click(banButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Action failed");
    });
  });
});
