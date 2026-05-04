import React from "react";
import { render, screen, waitFor, fireEvent } from "../../utils/test-utils";
import AppliedJobs from "../AppliedJobs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobService } from "../../services";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock jobService
vi.mock("../../services", () => ({
  jobService: {
    getAppliedJobs: vi.fn().mockResolvedValue({
      data: [
        {
          jobId: "job-1",
          position: "Full Stack Developer",
          posterName: "Tech Corp",
          district: "Silicon Valley",
          location: "HQ",
          salary: "$120k",
          jobType: "Full-time",
          status: "Interview",
          appliedAt: new Date().toISOString(),
          jobStatus: "Open",
        },
      ],
    }),
  },
}));

describe("AppliedJobs Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page and displays job applications", async () => {
    render(<AppliedJobs />);

    expect(screen.getByText(/My Applications/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText(/Full Stack Developer/i)).toBeDefined();
      expect(screen.getByText(/Tech Corp/i)).toBeDefined();
      expect(screen.getByText(/Interview/i)).toBeDefined();
      expect(screen.getByText(/Silicon Valley, HQ/i)).toBeDefined();
      expect(screen.getByText(/\$120k/i)).toBeDefined();
      expect(screen.getByText(/Full-time/i)).toBeDefined();
    });
  });

  it("navigates to job details when a job card is clicked", async () => {
    render(<AppliedJobs />);

    await waitFor(() => screen.getByText(/Full Stack Developer/i));

    const jobCard = screen
      .getByText(/Full Stack Developer/i)
      .closest('div[class*="cursor-pointer"]');
    fireEvent.click(jobCard);

    expect(mockNavigate).toHaveBeenCalledWith("/jobs/job-1");
  });

  it("displays empty state when no applications are found", async () => {
    jobService.getAppliedJobs.mockResolvedValueOnce({ data: [] });

    render(<AppliedJobs />);

    await waitFor(() => {
      expect(screen.getByText(/No applications yet/i)).toBeDefined();
      expect(
        screen.getByText(/You haven't applied to any job opportunities/i),
      ).toBeDefined();
    });

    const exploreBtn = screen.getByRole("button", { name: /Exlpore Jobs/i });
    fireEvent.click(exploreBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/jobs");
  });

  it("shows warning when a job is closed", async () => {
    jobService.getAppliedJobs.mockResolvedValueOnce({
      data: [
        {
          jobId: "job-2",
          position: "Designer",
          jobStatus: "Closed",
          status: "Under Review",
          appliedAt: new Date().toISOString(),
          posterName: "Design Studio",
          district: "New York",
          location: "Remote",
          salary: "$80k",
          jobType: "Contract",
        },
      ],
    });

    render(<AppliedJobs />);

    await waitFor(() => {
      expect(
        screen.getByText(/This job is no longer accepting new applications/i),
      ).toBeDefined();
    });
  });

  it("handles API error gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jobService.getAppliedJobs.mockRejectedValueOnce(new Error("Fetch failed"));

    render(<AppliedJobs />);

    await waitFor(() => {
      expect(screen.getByText(/No applications yet/i)).toBeDefined();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("displays correct status colors for different statuses", async () => {
    const mockApps = [
      {
        jobId: "1",
        position: "A",
        status: "Selected",
        appliedAt: new Date().toISOString(),
      },
      {
        jobId: "2",
        position: "B",
        status: "Rejected",
        appliedAt: new Date().toISOString(),
      },
      {
        jobId: "3",
        position: "C",
        status: "Interview",
        appliedAt: new Date().toISOString(),
      },
      {
        jobId: "4",
        position: "D",
        status: "Under Review",
        appliedAt: new Date().toISOString(),
      },
      {
        jobId: "5",
        position: "E",
        status: "Unknown",
        appliedAt: new Date().toISOString(),
      },
    ];
    jobService.getAppliedJobs.mockResolvedValueOnce({ data: mockApps });

    render(<AppliedJobs />);

    await waitFor(() => {
      expect(screen.getByText("Selected")).toHaveClass("text-emerald-400");
      expect(screen.getByText("Rejected")).toHaveClass("text-rose-400");
      expect(screen.getByText("Interview")).toHaveClass("text-amber-400");
      expect(screen.getByText("Under Review")).toHaveClass("text-blue-400");
      expect(screen.getByText("Unknown")).toHaveClass("text-slate-400");
    });
  });

  it("shows loading skeleton while fetching data", () => {
    // We don't resolve the promise immediately to see loading state
    jobService.getAppliedJobs.mockReturnValue(new Promise(() => {}));
    const { container } = render(<AppliedJobs />);
    expect(container.querySelector(".animate-pulse")).toBeDefined();
  });
});
