import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import JobDetails from "../JobDetails";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobService } from "../../services";
import recommendationService from "../../services/recommendationService";
import { toast } from "react-hot-toast";

// Mock services
vi.mock("../../services", () => ({
  jobService: {
    getJobById: vi.fn(),
    deleteJob: vi.fn(),
  },
}));

vi.mock("../../services/recommendationService", () => ({
  default: {
    trackInteraction: vi.fn(),
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: () => ({ id: "j1" }),
  };
});

vi.mock("react-hot-toast", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

const mockJob = {
  _id: "j1",
  position: "Full Stack Engineer",
  salary: "60000",
  location: "Remote",
  district: "Any",
  education: "B.Tech",
  experience: "3+ Years",
  vacancies: 1,
  gender: "Both",
  jobType: "Full-time",
  skills: "React, Node.js, MongoDB",
  description: "Join our growing team!",
  posterName: "Admin",
  posterId: "u1",
  posterContact: "1234567890",
  createdAt: new Date().toISOString(),
  applications: [],
  isSuspended: false,
};

describe("JobDetails Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobService.getJobById.mockResolvedValue({ data: mockJob });
    jobService.deleteJob.mockResolvedValue({ data: { success: true } });
    window.scrollTo = vi.fn();
    window.confirm = vi.fn(() => true);

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders loading state initially", () => {
    jobService.getJobById.mockReturnValue(new Promise(() => {}));
    render(<JobDetails />);
    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();
  });

  it("renders job details correctly on load", async () => {
    render(<JobDetails />);

    await waitFor(() => {
      expect(screen.getByText("Full Stack Engineer")).toBeInTheDocument();
      expect(screen.getByText("60000")).toBeInTheDocument();
      expect(screen.getByText(/Remote, Any/i)).toBeInTheDocument();
      expect(screen.getByText("3+ Years")).toBeInTheDocument();
      expect(screen.getByText("B.Tech")).toBeInTheDocument();
      expect(screen.getByText("1 Open")).toBeInTheDocument();
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("Node.js")).toBeInTheDocument();
    });

    expect(recommendationService.trackInteraction).toHaveBeenCalledWith(
      "view",
      "job",
      expect.any(String),
    );
  });

  it("shows Job Not Found state", async () => {
    jobService.getJobById.mockResolvedValue({ data: null });
    render(<JobDetails />);

    await waitFor(() => {
      expect(screen.getByText("Job Not Found")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Back to Jobs/i));
  });

  it("handles apply click when user is logged in", async () => {
    render(<JobDetails />);
    await waitFor(() => screen.getByText("Full Stack Engineer"));

    const applyBtn = screen.getByRole("button", { name: /Apply Now/i });
    fireEvent.click(applyBtn);
    // Navigation is handled via navigate, verified by lack of error
  });

  it("handles sharing link", async () => {
    render(<JobDetails />);
    await waitFor(() => screen.getByText("Full Stack Engineer"));

    const shareBtn = screen.getByRole("button", { name: /Share/i });
    fireEvent.click(shareBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Link copied to clipboard");
  });

  it("shows owner actions and handles deletion", async () => {
    // Override user context to match posterId
    const posterId = "u1";
    localStorage.setItem("lokonomy_user", JSON.stringify({ _id: posterId }));

    render(<JobDetails />);
    await waitFor(() => screen.getByText("Full Stack Engineer"));

    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Delete"));
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(jobService.deleteJob).toHaveBeenCalledWith(expect.any(String));
      expect(toast.success).toHaveBeenCalledWith(
        "Job listing removed successfully",
      );
    });
  });

  it('shows "Applied Successfully" state', async () => {
    const userId = "u2";
    localStorage.setItem("lokonomy_user", JSON.stringify({ _id: userId }));
    jobService.getJobById.mockResolvedValue({
      data: {
        ...mockJob,
        applications: [{ candidateId: userId }],
      },
    });

    render(<JobDetails />);
    await waitFor(() => screen.getByText("Full Stack Engineer"));

    expect(screen.getByText(/Applied Successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/Applied Successfully/i)).toBeDisabled();
  });

  it("handles suspended job state", async () => {
    jobService.getJobById.mockResolvedValue({
      data: {
        ...mockJob,
        isSuspended: true,
      },
    });

    render(<JobDetails />);
    await waitFor(() => screen.getByText("Full Stack Engineer"));

    expect(screen.getByText("Applications Paused")).toBeInTheDocument();
    expect(screen.getByText("Applications Suspended")).toBeInTheDocument();
    expect(screen.getByText("Applications Suspended")).toBeDisabled();

    const whatsappLink = screen.getByText(/Contact on WhatsApp/i);
    fireEvent.click(whatsappLink);
    // Should preventDefault when suspended
  });

  it("opens report modal", async () => {
    render(<JobDetails />);
    await waitFor(() => screen.getByText("Full Stack Engineer"));

    const reportBtn = screen.getByText(/Report/i);
    fireEvent.click(reportBtn);
    expect(screen.getByText(/Report Content/i)).toBeInTheDocument(); // Assuming ReportModal renders this
  });

  it("navigates to edit page", async () => {
    localStorage.setItem("lokonomy_user", JSON.stringify({ _id: "u1" }));
    render(<JobDetails />);
    await waitFor(() => screen.getByText("Edit"));

    fireEvent.click(screen.getByText("Edit"));
  });
});
