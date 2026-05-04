import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import Stories from "../Stories";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { storyService } from "../../services";
import { toast } from "react-hot-toast";

// Mock storyService
vi.mock("../../services", () => ({
  storyService: {
    getStories: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            _id: "s1",
            title: "Community News",
            content: "Something happened today!",
            type: "News",
            likes: [],
            views: 10,
            shares: 2,
            locationAddress: "Test Location",
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            isVerified: true,
          },
        ],
      },
    }),
    likeStory: vi.fn().mockResolvedValue({
      data: {
        data: {
          _id: "s1",
          title: "Community News",
          likes: ["u1"],
        },
      },
    }),
    shareStory: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock("../../context/UserContext", () => ({
  useUser: () => ({
    user: {
      id: "u1",
      name: "Test User",
      latitude: 23.0,
      longitude: 72.5,
      locationName: "Ahmedabad",
    },
  }),
}));

vi.mock("../../context/LocationContext", () => ({
  useLocation: () => ({ district: "Ahmedabad", taluka: "City" }),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Stories Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders community updates and radius selector", async () => {
    render(<Stories />);

    await waitFor(() => {
      expect(screen.getAllByText("Community News")[0]).toBeDefined();
      expect(screen.getByText(/Ahmedabad/i)).toBeDefined();
      expect(screen.getByLabelText(/Radius/i)).toBeDefined();
    });
  });

  it("filters stories by category", async () => {
    render(<Stories />);

    await waitFor(() => screen.getAllByText("Community News")[0]);

    const newsFilter = screen.getAllByRole("button", { name: /News/i })[0];
    fireEvent.click(newsFilter);

    await waitFor(() => {
      expect(storyService.getStories).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "News",
        }),
      );
    });
  });

  it("updates stories on search query change", async () => {
    render(<Stories />);

    const searchInput = screen.getByPlaceholderText(
      /Search community updates/i,
    );
    fireEvent.change(searchInput, { target: { value: "Cleanup" } });

    await waitFor(() => {
      expect(storyService.getStories).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Cleanup",
        }),
      );
    });
  });

  it("updates stories on radius change", async () => {
    render(<Stories />);

    const radiusSelect = screen.getByLabelText(/Radius/i);
    fireEvent.change(radiusSelect, { target: { value: "10000" } });

    await waitFor(() => {
      expect(storyService.getStories).toHaveBeenCalledWith(
        expect.objectContaining({
          radius: 10000,
        }),
      );
    });
  });

  it("handles liking a story successfully", async () => {
    render(<Stories />);

    await waitFor(() => screen.getAllByText("Community News")[0]);

    const likeBtn = screen.getByRole("button", { name: /0/ });
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(storyService.likeStory).toHaveBeenCalledWith("s1");
    });
  });

  it("handles sharing a story using navigator.share", async () => {
    Object.assign(navigator, {
      share: vi.fn().mockResolvedValue(undefined),
    });

    render(<Stories />);

    await waitFor(() => screen.getAllByText("Community News")[0]);

    const shareBtn = screen.getByRole("button", { name: /2/ });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(navigator.share).toHaveBeenCalled();
      expect(storyService.shareStory).toHaveBeenCalledWith("s1");
    });
  });

  it("handles sharing a story using clipboard fallback", async () => {
    delete navigator.share;
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<Stories />);

    await waitFor(() => screen.getAllByText("Community News")[0]);

    const shareBtn = screen.getByRole("button", { name: /2/ });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Link copied to clipboard!");
    });
  });

  it("opens report modal on flag icon click", async () => {
    render(<Stories />);

    await waitFor(() => screen.getAllByText("Community News")[0]);

    const flagBtn = screen.getByRole("button", { name: /Report/i }); // The flag button
    fireEvent.click(flagBtn);

    expect(screen.getByRole("dialog")).toBeDefined(); // ReportModal is rendered
  });

  it("shows empty state when no stories found", async () => {
    storyService.getStories.mockResolvedValueOnce({ data: { data: [] } });

    render(<Stories />);

    await waitFor(() => {
      expect(screen.getByText(/No Updates Found/i)).toBeDefined();
    });
  });
});
