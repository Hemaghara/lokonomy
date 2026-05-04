import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import EditJob from "../EditJob";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobService } from "../../services";
import { toast } from "react-hot-toast";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "j1" }),
    useNavigate: () => mockNavigate,
  };
});

// Mock LocationContext
vi.mock('../../context/LocationContext', () => ({
  LocationProvider: ({ children }) => <>{children}</>,
  useLocation: () => ({
    availableDistricts: ['Pune', 'Ahmedabad'],
  }),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => {
  const toastMock = {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  };
  return { 
    default: toastMock, 
    toast: toastMock, 
    Toaster: () => null 
  };
});

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock jobService
vi.mock("../../services", () => ({
  jobService: {
    getJobById: vi.fn(),
    updateJob: vi.fn(),
  },
}));

const mockJobData = {
  data: {
    _id: "j1",
    position: "Software Engineer",
    location: "Pune Office",
    vacancies: 2,
    education: "Graduate",
    district: "Pune",
    experience: "2 Years",
    skills: "React, Node",
    salary: "50,000",
    gender: "Both",
    posterName: "Admin",
    posterEmail: "admin@test.com",
    posterContact: "9876543210",
    status: "Open",
    description: "Detailed job description",
    jobType: "Full-time",
    deadline: "2026-12-31",
  },
};

describe("EditJob Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobService.getJobById.mockResolvedValue(mockJobData);
    jobService.updateJob.mockResolvedValue({ data: { success: true } });
  });

  it("shows loading spinner initially", () => {
    jobService.getJobById.mockReturnValue(new Promise(() => {}));
    render(<EditJob />);
    expect(screen.getByText(/Loading Job/i)).toBeInTheDocument();
  });

  it("fetches and displays job data", async () => {
    render(<EditJob />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Software Engineer")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Pune Office")).toBeInTheDocument();
      expect(screen.getByText("Graduate")).toBeInTheDocument(); // CustomDropdown shows selected label
    });
  });

  it("handles API error on load", async () => {
    jobService.getJobById.mockRejectedValue(new Error("Fetch failed"));
    render(<EditJob />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load job details");
      expect(mockNavigate).toHaveBeenCalledWith("/job-dashboard");
    });
  });

  it("handles custom dropdown interactions", async () => {
    render(<EditJob />);
    await waitFor(() => screen.getByDisplayValue("Software Engineer"));

    // Open Education dropdown
    const educationBtn = screen.getByText("Graduate").closest("button");
    fireEvent.click(educationBtn);

    // Select Post Graduate
    const pgOption = screen.getByText("Post Graduate");
    fireEvent.click(pgOption);

    expect(screen.getByText("Post Graduate")).toBeInTheDocument();
  });

  it("updates job details successfully", async () => {
    render(<EditJob />);
    await waitFor(() => screen.getByDisplayValue("Software Engineer"));

    fireEvent.change(screen.getByPlaceholderText(/e.g. Sales Executive/i), {
      target: { name: "position", value: "Senior Engineer" },
    });

    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(jobService.updateJob).toHaveBeenCalledWith(
        "j1",
        expect.objectContaining({
          position: "Senior Engineer",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Job updated successfully!");
      expect(mockNavigate).toHaveBeenCalledWith("/job-dashboard");
    });
  });

  it("handles API error on submission", async () => {
    jobService.updateJob.mockRejectedValue({
      response: { data: { message: "Update failed" } },
    });
    render(<EditJob />);
    await waitFor(() => screen.getByDisplayValue("Software Engineer"));

    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
  });

  it("validates required fields", async () => {
    render(<EditJob />);
    await waitFor(() => screen.getByDisplayValue("Software Engineer"));

    const positionInput = screen.getByPlaceholderText(/e.g. Sales Executive/i);
    fireEvent.change(positionInput, {
      target: { name: "position", value: "" },
    });

    // The form uses HTML5 validation 'required' attribute
    expect(positionInput).toBeRequired();
  });

  it("checks deadline date min attribute", async () => {
    render(<EditJob />);
    await waitFor(() => screen.getByDisplayValue("Software Engineer"));

    const deadlineInput = screen.getByText(/Application Deadline/i).closest('div').querySelector('input');
    const today = new Date().toISOString().split("T")[0];
    expect(deadlineInput.getAttribute("min")).toBe(today);
  });

  it("navigates back to dashboard on cancel", async () => {
    render(<EditJob />);
    await waitFor(() => screen.getByRole("button", { name: /Cancel/i }));

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/job-dashboard");
  });

  it("navigates back via the back button", async () => {
    render(<EditJob />);
    await waitFor(() => screen.getByText("Back to Dashboard"));

    const backBtn = screen.getByText("Back to Dashboard");
    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/job-dashboard");
  });
});
