import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import PostJob from "../PostJob";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobService } from "../../services";
import { toast } from "react-hot-toast";

// Mock services
vi.mock("../../services", () => ({
  jobService: { createJob: vi.fn() },
}));

vi.mock("../../context/LocationContext", () => ({
  useLocation: () => ({ availableDistricts: ["Pune", "Ahmedabad", "Mumbai"] }),
}));

vi.mock("../../hooks/usePlanLimits", () => ({
  usePlanLimits: () => ({ limits: { jobsPost: 10 } }),
}));

// Redundant toast mock removed to use global mock from vitest.setup.js

describe("PostJob Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobService.createJob.mockResolvedValue({ data: { success: true } });
  });

  it("renders the job posting form with remaining limits", () => {
    render(<PostJob />);
    expect(screen.getByText(/Post a Job Listing/i)).toBeInTheDocument();
    expect(screen.getByText(/Remaining: 10 \/ 10/i)).toBeInTheDocument();
  });

  it("submits the form successfully with all fields", async () => {
    render(<PostJob />);

    // Fill Role Specifications
    fireEvent.change(screen.getByLabelText(/Job Position/i), {
      target: { name: "position", value: "Software Engineer" },
    });
    fireEvent.change(screen.getByLabelText(/Location \/ Area/i), {
      target: { name: "location", value: "Bopal" },
    });
    fireEvent.change(screen.getByLabelText(/Vacancies/i), {
      target: { name: "vacancies", value: "2" },
    });

    // Select District
    fireEvent.click(screen.getByText(/Select District/i));
    fireEvent.click(screen.getByText("Ahmedabad"));

    // Select Job Type
    fireEvent.click(screen.getByText(/Full-time/i)); // Default value button
    fireEvent.click(screen.getByText("Freelance"));

    // Fill Requirements
    fireEvent.change(screen.getByLabelText(/Experience/i), {
      target: { name: "experience", value: "3 Years" },
    });
    fireEvent.change(screen.getByLabelText(/Monthly Salary/i), {
      target: { name: "salary", value: "50000" },
    });
    fireEvent.change(screen.getByLabelText(/Required Skills/i), {
      target: { name: "skills", value: "React, Node" },
    });
    fireEvent.change(screen.getByLabelText(/Job Description/i), {
      target: { name: "description", value: "Great job" },
    });

    // Fill Contact
    fireEvent.change(screen.getByLabelText(/Hiring Officer/i), {
      target: { name: "posterName", value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Official Email/i), {
      target: { name: "posterEmail", value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Primary Contact/i), {
      target: { name: "posterContact", value: "1234567890" },
    });

    const submitBtn = screen.getByRole("button", {
      name: /Publish Job Listing/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(jobService.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          position: "Software Engineer",
          district: "Ahmedabad",
          jobType: "Freelance",
          posterContact: "1234567890",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Job posted successfully!");
    });
  });

  const fillRequiredFields = () => {
    fireEvent.change(screen.getByLabelText(/Job Position/i), {
      target: { name: "position", value: "Dev" },
    });
    fireEvent.change(screen.getByLabelText(/Location \/ Area/i), {
      target: { name: "location", value: "Loc" },
    });
    fireEvent.change(screen.getByLabelText(/Vacancies/i), {
      target: { name: "vacancies", value: "1" },
    });
    fireEvent.click(screen.getByText(/Select District/i));
    fireEvent.click(screen.getByText("Pune"));
    fireEvent.change(screen.getByLabelText(/Experience/i), {
      target: { name: "experience", value: "1" },
    });
    fireEvent.change(screen.getByLabelText(/Monthly Salary/i), {
      target: { name: "salary", value: "100" },
    });
    fireEvent.change(screen.getByLabelText(/Required Skills/i), {
      target: { name: "skills", value: "Skills" },
    });
    fireEvent.change(screen.getByLabelText(/Job Description/i), {
      target: { name: "description", value: "Desc" },
    });
    fireEvent.change(screen.getByLabelText(/Hiring Officer/i), {
      target: { name: "posterName", value: "Name" },
    });
    fireEvent.change(screen.getByLabelText(/Official Email/i), {
      target: { name: "posterEmail", value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/Primary Contact/i), {
      target: { name: "posterContact", value: "123" },
    });
  };

  it('handles "LIMIT_REACHED" error with specialized toast', async () => {
    jobService.createJob.mockRejectedValueOnce({
      response: { data: { code: "LIMIT_REACHED", message: "Limit reached" } },
    });

    render(<PostJob />);

    fillRequiredFields();

    fireEvent.click(
      screen.getByRole("button", { name: /Publish Job Listing/i }),
    );

    await waitFor(() => {
      // The LIMIT_REACHED toast is complex, verify toast is called
      expect(toast).toHaveBeenCalled();
    });
  });

  it("handles generic submission error", async () => {
    jobService.createJob.mockRejectedValueOnce({
      response: { data: { message: "Internal Server Error" } },
    });

    render(<PostJob />);
    fillRequiredFields();

    fireEvent.click(
      screen.getByRole("button", { name: /Publish Job Listing/i }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Internal Server Error");
    });
  });

  it("validates deadline date", () => {
    render(<PostJob />);
    const deadlineInput = screen.getByLabelText(/Application Deadline/i);

    const today = new Date().toISOString().split("T")[0];
    expect(deadlineInput.getAttribute("min")).toBe(today);
  });

  it("updates loading state during submission", async () => {
    jobService.createJob.mockReturnValueOnce(
      new Promise(() => {})
    );

    render(<PostJob />);
    fillRequiredFields();

    fireEvent.click(
      screen.getByRole("button", { name: /Publish Job Listing/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Publishing.../i)).toBeInTheDocument();
    });

    const button = screen.getByText(/Publishing.../i).closest("button");
    expect(button).toBeDisabled();
  });
});
