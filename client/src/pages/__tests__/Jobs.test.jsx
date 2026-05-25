import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import Jobs from "../Jobs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobService } from "../../services";
import { toast } from "react-hot-toast";

// Mock jobService
vi.mock("../../services", () => ({
  jobService: {
    getJobs: vi.fn(),
    deleteJob: vi.fn(),
  },
  wishlistService: {
    checkWishlistStatus: vi.fn().mockResolvedValue({ isSaved: false }),
    toggleWishlist: vi.fn().mockResolvedValue({ success: true, isSaved: true }),
  },
}));

vi.mock("../../context/LocationContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useLocation: () => ({
      state: "Maharashtra",
      district: "",
      taluka: "",
      availableDistricts: ["Mumbai"],
    }),
  };
});

vi.mock("../../data/locations", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getTalukas: vi.fn().mockReturnValue(["Andheri"]),
  };
});

var mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("react-hot-toast", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toast: mockToast,
  };
});

const mockJobs = [
  {
    _id: "j1",
    position: "Web Developer",
    salary: "45000",
    location: "Remote",
    education: "Graduate",
    experience: "2 Years",
    vacancies: 2,
    gender: "Both",
    jobType: "Full-time",
    applications: [],
    posterContact: "9999999999",
    deadline: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days left
  },
  {
    _id: "j2",
    position: "Graphic Designer",
    salary: "30000",
    location: "Pune",
    education: "12th pass",
    experience: "1 Year",
    vacancies: 1,
    gender: "Female",
    jobType: "Part-time",
    applications: [{ candidateId: "u2" }],
    posterContact: "8888888888",
    deadline: new Date().toISOString(), // Closes today
  },
];

describe("Jobs Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobService.getJobs.mockResolvedValue({ data: { jobs: mockJobs, pagination: { hasMore: false, total: 2 } } });
    jobService.deleteJob.mockResolvedValue({ data: { success: true } });
    window.confirm = vi.fn(() => true);

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders loading skeletons initially", () => {
    jobService.getJobs.mockReturnValue(new Promise(() => {}));
    render(<Jobs />);
    // SkeletonCard uses animate-pulse
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders job listings correctly", async () => {
    render(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText("Web Developer")).toBeInTheDocument();
      expect(screen.getByText("Graphic Designer")).toBeInTheDocument();
      expect(screen.getByText("45000")).toBeInTheDocument();
      expect(screen.getByText("30000")).toBeInTheDocument();
    });

    expect(screen.getByText("5 days left")).toBeInTheDocument();
    expect(screen.getByText("Closes today")).toBeInTheDocument();
  });

  it("filters jobs by gender", async () => {
    render(<Jobs />);
    await waitFor(() => screen.getByText("Web Developer"));

    const femaleFilter = screen.getByRole("button", { name: /^Female$/i });
    fireEvent.click(femaleFilter);

    await waitFor(() => {
      expect(jobService.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          gender: "Female",
        }),
      );
    });
  });

  it("filters jobs by job type", async () => {
    render(<Jobs />);
    await waitFor(() => screen.getByText("Web Developer"));

    const partTimeFilter = screen.getByRole("button", { name: /Part-time/i });
    fireEvent.click(partTimeFilter);

    await waitFor(() => {
      expect(jobService.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: "Part-time",
        }),
      );
    });
  });

  it("searches for jobs and clears search", async () => {
    render(<Jobs />);
    await waitFor(() => screen.getByText("Web Developer"));

    const searchInput = screen.getByPlaceholderText(/Search by position/i);
    fireEvent.change(searchInput, { target: { value: "Designer" } });

    fireEvent.click(screen.getByRole("button", { name: /Search/i }));

    await waitFor(() => {
      expect(jobService.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Designer",
        }),
      );
    });

    // Clear search
    const clearBtn = screen.getByRole("button", { name: /Clear/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(jobService.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          search: undefined,
        }),
      );
    });
  });

  it("handles location filters", async () => {
    render(<Jobs />);

    const districtSelect = screen.getByLabelText(/Select District/i);
    fireEvent.change(districtSelect, { target: { value: "Mumbai" } });

    await waitFor(() => {
      expect(jobService.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          district: "Mumbai",
        }),
      );
    });

    const talukaSelect = screen.getByLabelText(/Select Taluka/i);
    // Note: Talukas are loaded via getTalukas data, which might be empty in test unless mocked
    fireEvent.change(talukaSelect, { target: { value: "Andheri" } });

    await waitFor(() => {
      expect(jobService.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          taluka: "Andheri",
        }),
      );
    });
  });

  it("handles sharing link", async () => {
    render(<Jobs />);
    await waitFor(() => screen.getByText("Web Developer"));

    const shareBtns = screen.getAllByTitle("Share");
    fireEvent.click(shareBtns[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith("Link copied!"));
  });

  it("opens report modal", async () => {
    render(<Jobs />);
    await waitFor(() => screen.getByText("Web Developer"));

    const reportBtns = screen.getAllByTitle("Report Listing");
    fireEvent.click(reportBtns[0]);

    expect(screen.getByText(/Report Content/i)).toBeInTheDocument();
  });

  it("shows empty state when no jobs found", async () => {
    jobService.getJobs.mockResolvedValueOnce({ data: { jobs: [], pagination: { hasMore: false, total: 0 } } });
    render(<Jobs />);

    await waitFor(() => {
      expect(screen.getByText(/No Jobs Found/i)).toBeInTheDocument();
    });
  });

  it("handles job deletion by poster", async () => {
    localStorage.setItem("lokonomy_user", JSON.stringify({ _id: "u1" }));
    jobService.getJobs.mockResolvedValue({
      data: {
        jobs: [
          {
            ...mockJobs[0],
            posterId: "u1",
          },
        ],
        pagination: { hasMore: false, total: 1 }
      }
    });

    render(<Jobs />);
    await waitFor(() => screen.getByText("Web Developer"));

    const deleteBtn = screen.getByTitle("Delete Listing");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(jobService.deleteJob).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith(
        "Job listing removed successfully",
      );
    });
  });

  it("navigates to apply and job details", async () => {
    render(<Jobs />);
    await waitFor(() => screen.getByText("Web Developer"));

    fireEvent.click(screen.getAllByText("Apply Now")[0]);
    fireEvent.click(screen.getByText("Web Developer"));
    fireEvent.click(screen.getByText("Post Job"));
    fireEvent.click(screen.getByText("My Applications"));
  });

  it('shows "Applied" button when user has already applied', async () => {
    localStorage.setItem("lokonomy_user", JSON.stringify({ _id: "u2" }));
    render(<Jobs />);
    await waitFor(() => screen.getByText("Graphic Designer"));

    expect(screen.getByText("Applied")).toBeInTheDocument();
    expect(screen.getByText("Applied")).toBeDisabled();
  });

  it("displays fill rate correctly", async () => {
    render(<Jobs />);
    await waitFor(() => screen.getByText("Graphic Designer"));

    // j2 has 1 application and 1 vacancy = 100% fill rate
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
