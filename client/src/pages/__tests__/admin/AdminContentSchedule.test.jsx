import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminContentSchedule from "../../admin/AdminContentSchedule";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

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
    getScheduledContent: vi.fn(),
    togglePinFeed: vi.fn(),
    scheduleStory: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockData = {
  data: {
    scheduledStories: [
      {
        _id: "s1",
        title: "Summer Sale Prep",
        author: { name: "Alice" },
        scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      },
    ],
    pinnedFeeds: [
      {
        _id: "f1",
        caption: "Welcome to the community guidelines update",
        author: { name: "Admin Team" },
        pinnedAt: new Date().toISOString(),
      },
    ],
    expiringStories: [
      {
        _id: "s2",
        title: "Flash Deal 24h",
        author: { name: "Bob" },
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      },
    ],
  },
};

describe("AdminContentSchedule Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    adminService.getScheduledContent.mockReturnValue(new Promise(() => {}));
    render(<AdminContentSchedule />);
    expect(screen.getByRole("button", { name: /Refresh/i })).toBeDisabled();
    expect(screen.queryByText("Scheduled Stories")).not.toBeInTheDocument();
  });

  it("renders schedule data successfully", async () => {
    adminService.getScheduledContent.mockResolvedValue(mockData);
    render(<AdminContentSchedule />);

    await screen.findByText("Summer Sale Prep");
    expect(
      screen.getByText(/Welcome to the community guidelines update/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Flash Deal 24h")).toBeInTheDocument();

    // Check authors
    expect(screen.getByText(/By Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/By Admin Team/i)).toBeInTheDocument();
  });

  it("displays empty states when data arrays are empty", async () => {
    adminService.getScheduledContent.mockResolvedValue({
      data: {
        scheduledStories: [],
        pinnedFeeds: [],
        expiringStories: [],
      },
    });
    render(<AdminContentSchedule />);

    await screen.findByText("No stories scheduled for future release");
    expect(
      screen.getByText("No feed posts pinned currently"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No stories expiring in the next 7 days"),
    ).toBeInTheDocument();
  });

  it("handles manual refresh", async () => {
    adminService.getScheduledContent.mockResolvedValue(mockData);
    render(<AdminContentSchedule />);

    await screen.findByText("Summer Sale Prep");

    const refreshBtn = screen.getByRole("button", { name: /Refresh/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(adminService.getScheduledContent).toHaveBeenCalledTimes(2);
    });
  });

  it("handles fetching error correctly", async () => {
    adminService.getScheduledContent.mockRejectedValue(
      new Error("Network error"),
    );
    render(<AdminContentSchedule />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to load content schedule",
      );
    });
  });

  it("handles unpinning a post successfully", async () => {
    adminService.getScheduledContent.mockResolvedValue(mockData);
    adminService.togglePinFeed.mockResolvedValue({});
    render(<AdminContentSchedule />);

    await screen.findByText(/Welcome to the community guidelines update/i);

    const unpinBtn = screen.getByTitle("Unpin Post");
    fireEvent.click(unpinBtn);

    await waitFor(() => {
      expect(adminService.togglePinFeed).toHaveBeenCalledWith("f1");
      expect(toast.success).toHaveBeenCalledWith("Feed pinning status updated");
      expect(adminService.getScheduledContent).toHaveBeenCalledTimes(2); // refetches
    });
  });

  it("handles unpinning a post error", async () => {
    adminService.getScheduledContent.mockResolvedValue(mockData);
    adminService.togglePinFeed.mockRejectedValue(new Error("API error"));
    render(<AdminContentSchedule />);

    await screen.findByText(/Welcome to the community guidelines update/i);

    const unpinBtn = screen.getByTitle("Unpin Post");
    fireEvent.click(unpinBtn);

    await waitFor(() => {
      expect(adminService.togglePinFeed).toHaveBeenCalledWith("f1");
      expect(toast.error).toHaveBeenCalledWith("Failed to update pinning");
    });
  });

  it("navigates to manage story details", async () => {
    adminService.getScheduledContent.mockResolvedValue(mockData);
    render(<AdminContentSchedule />);

    await screen.findByText("Flash Deal 24h");

    const manageBtn = screen.getByRole("button", { name: /Manage/i });
    fireEvent.click(manageBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/stories-feed/story/s2");
  });
});
