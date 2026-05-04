import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import StoryDetails from "../StoryDetails";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { storyService } from "../../services";
import { toast } from "react-hot-toast";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: () => ({ id: "story123" }),
    useNavigate: () => vi.fn(),
  };
});

// Mock storyService
vi.mock("../../services", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    storyService: {
      ...actual.storyService,
      getStoryById: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            _id: "story123",
            title: "Community Garden Cleanup",
            content: "Join us this Saturday for a cleanup event.",
            author: "Green Thumb",
            type: "Events",
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            views: 42,
            locationAddress: "123 Park Ave",
          },
        },
      }),
    },
  };
});


describe("StoryDetails Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    storyService.getStoryById.mockReturnValueOnce(new Promise(() => {})); // Never resolves
    render(<StoryDetails />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("renders story details correctly", async () => {
    render(<StoryDetails />);

    await waitFor(() => {
      expect(screen.getByText(/Community Garden Cleanup/i)).toBeInTheDocument();
      expect(screen.getByText(/Green Thumb/i)).toBeInTheDocument();
      expect(screen.getByText(/123 Park Ave/i)).toBeInTheDocument();
      expect(screen.getByText(/Join us this Saturday/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it("handles story not found", async () => {
    storyService.getStoryById.mockResolvedValueOnce({
      data: { success: false, data: null },
    });
    render(<StoryDetails />);

    await waitFor(() => {
      expect(screen.getByText(/Story Not Found/i)).toBeDefined();
    });
  });



  it("renders expiry status correctly", async () => {
    render(<StoryDetails />);

    await waitFor(() => {
      // It says "Xh Ym Left"
      expect(screen.getByText(/Left/i)).toBeDefined();
    });
  });

  it("navigates back to stories", async () => {
    render(<StoryDetails />);
    await waitFor(() => {
       const backLinks = screen.getAllByText(/Back to Stories/i);
       expect(backLinks.length).toBeGreaterThan(0);
       const link = backLinks.find(el => el.closest("a")?.getAttribute("href") === "/stories");
       expect(link).toBeDefined();
    });
  });
});
