import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminJobDetails from "../../admin/AdminJobDetails";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, custom, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    header: ({ children, ...props }) => {
      const { initial, animate, exit, transition, custom, variants, ...rest } =
        props;
      return <header {...rest}>{children}</header>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "job1" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../services", () => ({
  adminService: {
    getJobDetails: vi.fn(),
    getJobPosterUsage: vi.fn(),
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

const mockJobData = {
  data: {
    _id: "job1",
    position: "Software Engineer",
    jobType: "Full Time",
    location: "Remote",
    district: "Tech Hub",
    experience: "2-4 Years",
    skills: "React, Node.js",
    gender: "Any",
    salary: "₹50,000 - ₹80,000",
    education: "B.Tech",
    vacancies: 3,
    description: "Great job opportunity.",
    status: "Open",
    views: 150,
    isFlagged: false,
    isSuspended: false,
    posterId: {
      _id: "poster1",
      subscription: { plan: "gold", status: "active" },
    },
    posterName: "Acme Corp",
    posterEmail: "hr@acme.com",
    posterContact: "1234567890",
    applications: [
      {
        _id: "app1",
        candidateName: "John Doe",
        candidateContact: "0987654321",
        candidateEducation: "MCA",
        applicationStatus: "Under Review",
        appliedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const mockUsageData = {
  data: {
    usage: {
      jobsPosted: 5,
      jobsLimit: 10,
      percentUsed: 50,
      remaining: 5,
    },
    user: {
      plan: "Gold",
      subscriptionStatus: "Active",
    },
  },
};

describe("AdminJobDetails Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    adminService.getJobDetails.mockReturnValue(new Promise(() => {}));
    render(<AdminJobDetails />);
    expect(screen.getByText("Loading job…")).toBeInTheDocument();
  });

  it("renders not found state when fetch fails", async () => {
    adminService.getJobDetails.mockRejectedValue(new Error("Fetch error"));
    render(<AdminJobDetails />);

    await screen.findByText("Not Found");
    expect(
      screen.getByText("This job could not be located in the database."),
    ).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: /Return to Jobs/i });
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/admin/jobs");
  });

  it("renders job details successfully", async () => {
    adminService.getJobDetails.mockResolvedValue(mockJobData);
    adminService.getJobPosterUsage.mockResolvedValue(mockUsageData);

    render(<AdminJobDetails />);

    await screen.findByRole("heading", { name: /Software Engineer/i });

    // Header & Badges
    expect(screen.getAllByText("Open")[0]).toBeInTheDocument();
    expect(screen.getByText(/Remote · Tech Hub/)).toBeInTheDocument();

    // Stats Tiles
    expect(screen.getAllByText("₹50,000 - ₹80,000")[0]).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // Vacancies
    expect(screen.getByText("1 received")).toBeInTheDocument(); // Applications

    // Job details box
    expect(screen.getByText("Full Time")).toBeInTheDocument();
    expect(screen.getByText("Great job opportunity.")).toBeInTheDocument();

    // Poster Profile
    expect(screen.getByText("hr@acme.com")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();

    // Applications List
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Under Review")).toBeInTheDocument();

    // Usage
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("/ 10")).toBeInTheDocument();
    expect(screen.getByText(/50% quota used/)).toBeInTheDocument();

    // Moderation Status
    expect(screen.getByText("Not Banned")).toBeInTheDocument();
    expect(screen.getAllByText("Active")[0]).toBeInTheDocument(); // not suspended

    // Registry Info
    expect(screen.getByText("job1")).toBeInTheDocument();
    expect(screen.getByText("poster1")).toBeInTheDocument();
  });

  it("handles navigate back", async () => {
    adminService.getJobDetails.mockResolvedValue(mockJobData);
    render(<AdminJobDetails />);

    await screen.findByRole("heading", { name: /Software Engineer/i });

    const backBtn =
      screen.getByRole("button", { name: /Go back/i }) ||
      screen.getAllByRole("button")[0];
    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("handles toggle ban success", async () => {
    adminService.getJobDetails.mockResolvedValue(mockJobData);
    adminService.toggleBanJob.mockResolvedValue({
      data: { message: "Job banned successfully" },
    });

    render(<AdminJobDetails />);
    await screen.findByRole("heading", { name: /Software Engineer/i });

    const banBtn = screen.getByRole("button", { name: /Ban/i });
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(adminService.toggleBanJob).toHaveBeenCalledWith("job1");
      expect(toast.success).toHaveBeenCalledWith("Job banned successfully");
      expect(adminService.getJobDetails).toHaveBeenCalledTimes(2); // refetches
    });
  });

  it("handles toggle ban error", async () => {
    adminService.getJobDetails.mockResolvedValue(mockJobData);
    adminService.toggleBanJob.mockRejectedValue(new Error("Ban error"));

    render(<AdminJobDetails />);
    await screen.findByRole("heading", { name: /Software Engineer/i });

    const banBtn = screen.getByRole("button", { name: /Ban/i });
    fireEvent.click(banBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Action failed");
    });
  });

  it("handles toggle suspend success", async () => {
    adminService.getJobDetails.mockResolvedValue(mockJobData);
    adminService.toggleSuspendJob.mockResolvedValue({
      data: { message: "Job suspended successfully" },
    });

    render(<AdminJobDetails />);
    await screen.findByRole("heading", { name: /Software Engineer/i });

    const suspendBtn = screen.getByRole("button", { name: /Suspend/i });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(adminService.toggleSuspendJob).toHaveBeenCalledWith("job1");
      expect(toast.success).toHaveBeenCalledWith("Job suspended successfully");
      expect(adminService.getJobDetails).toHaveBeenCalledTimes(2);
    });
  });

  it("handles empty applications gracefully", async () => {
    const dataWithoutApps = JSON.parse(JSON.stringify(mockJobData));
    dataWithoutApps.data.applications = [];
    adminService.getJobDetails.mockResolvedValue(dataWithoutApps);
    render(<AdminJobDetails />);
    await screen.findByText("No applications received yet");
  });
});
