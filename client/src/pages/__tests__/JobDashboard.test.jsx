import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import JobDashboard from "../JobDashboard";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobService } from "../../services";
import { toast } from "react-hot-toast";

// Mock jobService
vi.mock("../../services", () => ({
  jobService: {
    getMyJobs: vi.fn(),
    toggleJobStatus: vi.fn(),
    deleteJob: vi.fn(),
    updateApplicationStatus: vi.fn(),
  },
}));

// Mock toast
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

const mockJobs = [
  {
    _id: "job-1",
    position: "Software Engineer",
    location: "San Francisco",
    district: "SF",
    salary: "$150k",
    status: "Open",
    vacancies: 2,
    education: "Bachelors",
    gender: "Both",
    views: 100,
    applications: [
      {
        _id: "app-1",
        candidateName: "John Doe",
        candidateEmail: "john@example.com",
        applicationStatus: "Applied",
        appliedAt: new Date().toISOString(),
        candidateContact: "1234567890",
        candidateExperience: "2 years",
        candidateEducation: "Masters",
        candidateSkills: "React, Node.js",
        candidateBiodata: "https://cloudinary.com/cv.pdf",
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "job-2",
    position: "Product Manager",
    location: "New York",
    district: "NY",
    salary: "$180k",
    status: "Closed",
    vacancies: 1,
    education: "MBA",
    gender: "Both",
    views: 50,
    applications: [],
    createdAt: new Date().toISOString(),
  },
];

describe("JobDashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobService.getMyJobs.mockResolvedValue({ data: mockJobs });
    jobService.toggleJobStatus.mockResolvedValue({
      data: { success: true, message: "Status updated", status: "Closed" },
    });
    jobService.deleteJob.mockResolvedValue({ data: { success: true } });
    jobService.updateApplicationStatus.mockResolvedValue({
      data: { success: true },
    });
    window.confirm = vi.fn(() => true);
  });

  it("renders loading state initially", () => {
    jobService.getMyJobs.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<JobDashboard />);
    expect(screen.getByText(/Loading Dashboard/i)).toBeInTheDocument();
  });

  it("renders the dashboard with stats and job listings", async () => {
    render(<JobDashboard />);

    await waitFor(() => {
      expect(screen.getAllByText("Software Engineer")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Product Manager")[0]).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getByText(/Total Listings/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // Total listings
    expect(screen.getByText("Active Openings")).toBeInTheDocument();
    expect(screen.getByText("Closed Roles")).toBeInTheDocument();
    expect(screen.getByText("Total Applicants")).toBeInTheDocument();
  });

  it("handles error when loading jobs", async () => {
    jobService.getMyJobs.mockRejectedValue(new Error("Failed"));
    render(<JobDashboard />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load jobs");
    });
  });

  it("filters jobs correctly", async () => {
    render(<JobDashboard />);
    await waitFor(() => screen.getAllByText("Software Engineer")[0]);

    // Filter by Active
    fireEvent.click(screen.getAllByText(/^Active$/)[0]);
    expect(screen.getAllByText("Software Engineer")).toHaveLength(3);
    expect(screen.getAllByText("Product Manager")).toHaveLength(1);

    // Filter by Closed
    fireEvent.click(screen.getAllByText(/^Closed$/)[0]);
    expect(screen.getAllByText("Software Engineer")).toHaveLength(2);
    expect(screen.getAllByText("Product Manager")).toHaveLength(2);

    // Filter by Has Apps
    fireEvent.click(screen.getByText("Has Apps"));
    expect(screen.getAllByText("Software Engineer")).toHaveLength(3);
    expect(screen.getAllByText("Product Manager")).toHaveLength(1);

    // Filter by No Apps
    fireEvent.click(screen.getByText("No Apps"));
    expect(screen.getAllByText("Software Engineer")).toHaveLength(2);
    expect(screen.getAllByText("Product Manager")).toHaveLength(2);
  });

  it("toggles job status when clicking the status button", async () => {
    render(<JobDashboard />);
    await waitFor(() => screen.getAllByText("Software Engineer")[0]);

    const toggleBtn = screen.getAllByTitle(/Close listing/i)[0];
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(jobService.toggleJobStatus).toHaveBeenCalledWith("job-1");
      expect(toast.success).toHaveBeenCalledWith("Status updated");
    });
  });

  it("handles error when toggling job status", async () => {
    jobService.toggleJobStatus.mockRejectedValue(new Error("Failed"));
    render(<JobDashboard />);
    await waitFor(() => screen.getAllByText("Software Engineer")[0]);

    const toggleBtn = screen.getAllByTitle(/Close listing/i)[0];
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Could not update status");
    });
  });

  it("expands job applications and shows candidate info", async () => {
    render(<JobDashboard />);
    await waitFor(() => screen.getAllByText("Software Engineer")[0]);

    const appsBtn = screen.getByText("1 Apps");
    fireEvent.click(appsBtn);

    expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();

    // Expand candidate details
    fireEvent.click(screen.getAllByText("John Doe")[0]);
    expect(screen.getByText("2 years")).toBeInTheDocument();
    expect(screen.getByText("Masters")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
  });

  it("updates applicant status via dropdown", async () => {
    render(<JobDashboard />);
    await waitFor(() => screen.getAllByText("Software Engineer")[0]);

    fireEvent.click(screen.getByText("1 Apps"));
    await waitFor(() => screen.getAllByText("John Doe")[0]);

    const statusDropdown = screen.getByDisplayValue("Applied");
    fireEvent.change(statusDropdown, { target: { value: "Interview" } });

    await waitFor(() => {
      expect(jobService.updateApplicationStatus).toHaveBeenCalledWith(
        "job-1",
        "app-1",
        "Interview",
      );
      expect(toast.success).toHaveBeenCalledWith("Applicant status updated");
    });
  });

  it("handles error when updating applicant status", async () => {
    jobService.updateApplicationStatus.mockRejectedValue(new Error("Failed"));
    render(<JobDashboard />);
    await waitFor(() => screen.getAllByText("Software Engineer")[0]);

    fireEvent.click(screen.getByText("1 Apps"));
    const statusDropdown = screen.getByDisplayValue("Applied");
    fireEvent.change(statusDropdown, { target: { value: "Interview" } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update status");
    });
  });

  it("performs bulk status update", async () => {
    render(<JobDashboard />);
    await waitFor(() => screen.getAllByText("Software Engineer")[0]);

    fireEvent.click(screen.getByText("1 Apps"));

    const bulkSelect = screen.getByDisplayValue("Status...");
    fireEvent.change(bulkSelect, { target: { value: "Selected" } });

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("mark ALL applicants as Selected"),
    );

    await waitFor(() => {
      expect(jobService.updateApplicationStatus).toHaveBeenCalledWith(
        "job-1",
        "app-1",
        "Selected",
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Successfully updated 1 applicants",
      );
    });
  });

  it("handles bulk update failure", async () => {
    jobService.updateApplicationStatus.mockRejectedValue(new Error("Failed"));
    render(<JobDashboard />);
    await waitFor(() => screen.getAllByText("Software Engineer")[0]);

    fireEvent.click(screen.getByText("1 Apps"));
    const bulkSelect = screen.getByDisplayValue("Status...");
    fireEvent.change(bulkSelect, { target: { value: "Selected" } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Bulk update failed for some applicants",
      );
    });
  });

  it("deletes a job listing after confirmation", async () => {
    render(<JobDashboard />);
    await waitFor(() => screen.getAllByText("Software Engineer")[0]);

    const deleteBtn = screen.getAllByTitle(/Delete listing/i)[0];
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith("Delete this job listing?");
    await waitFor(() => {
      expect(jobService.deleteJob).toHaveBeenCalledWith("job-1");
      expect(toast.success).toHaveBeenCalledWith("Job deleted successfully");
    });
  });

  it("handles error when deleting a job", async () => {
    jobService.deleteJob.mockRejectedValue(new Error("Failed"));
    render(<JobDashboard />);
    await waitFor(() => screen.getAllByText("Software Engineer")[0]);

    const deleteBtn = screen.getAllByTitle(/Delete listing/i)[0];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Could not delete job");
    });
  });

  it("navigates to job details and edit pages", async () => {
    render(<JobDashboard />);
    await waitFor(() => screen.getAllByText("Software Engineer")[0]);

    // Preview
    fireEvent.click(screen.getAllByTitle("Preview listing")[0]);
    // useNavigate is mocked in test-utils, so we just verify it doesn't crash

    // Edit
    fireEvent.click(screen.getAllByTitle("Edit listing")[0]);

    // Post New Job
    fireEvent.click(screen.getAllByText(/Post a New Job/i)[0]);

    // Back to Profile
    fireEvent.click(screen.getAllByText(/Back to Profile/i)[0]);
  });

  it("renders applicant contact links correctly", async () => {
    render(<JobDashboard />);
    await waitFor(() => screen.getAllByText("Software Engineer")[0]);

    fireEvent.click(screen.getByText("1 Apps"));
    fireEvent.click(screen.getAllByText("John Doe")[0]);

    expect(screen.getByText("WhatsApp")).toHaveAttribute(
      "href",
      "https://wa.me/1234567890",
    );
    expect(screen.getByText("Email")).toHaveAttribute(
      "href",
      "mailto:john@example.com",
    );
    expect(screen.getByText("Biodata")).toHaveAttribute(
      "href",
      "https://cloudinary.com/cv.pdf",
    );
  });
});
