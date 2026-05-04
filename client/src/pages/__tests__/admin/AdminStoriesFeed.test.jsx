import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminStoriesFeed from "../../../pages/admin/AdminStoriesFeed";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";
import { ConfirmProvider } from "../../../context/ConfirmContext";
import ConfirmModal from "../../../components/admin/ConfirmModal";

vi.mock("../../../services", () => ({
  adminService: {
    getStoriesFeedStats: vi.fn(),
    getStories: vi.fn(),
    getFeeds: vi.fn(),
    deleteStory: vi.fn(),
    deleteFeed: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockStats = {
  totalStories: 15,
  totalFeeds: 20,
  storyTypes: { News: 5, Events: 10 },
  feedTypes: { Sale: 8, Event: 12 },
};

const mockStories = {
  stories: [
    {
      _id: "story1",
      title: "Story 1",
      content: "Story 1 Content",
      type: "News",
      author: "Author 1",
      authorId: { profilePic: "pic1.jpg" },
      createdAt: "2023-01-01T00:00:00Z",
      locationAddress: "Location 1",
      isHighlighted: true,
      image: "image1.jpg",
    },
    {
      _id: "story2",
      title: "Story 2",
      content: "Story 2 Content",
      type: "Events",
      author: "Author 2",
      createdAt: "2023-01-02T00:00:00Z",
    },
  ],
  totalPages: 1,
};

const mockFeeds = {
  feeds: [
    {
      _id: "feed1",
      title: "Feed 1",
      content: "Feed 1 Content",
      type: "Sale",
      author: "Author 3",
      createdAt: "2023-01-03T00:00:00Z",
      eventDate: "2023-01-10",
      eventTime: "10:00 AM",
    },
  ],
  totalPages: 1,
};

describe("AdminStoriesFeed Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <ConfirmProvider>
        <ConfirmModal />
        <MemoryRouter initialEntries={["/admin/stories-feed"]}>
          <Routes>
            <Route path="/admin/stories-feed" element={<AdminStoriesFeed />} />
            <Route
              path="/admin/stories-feed/story/:id"
              element={<div>Story Details Page</div>}
            />
            <Route
              path="/admin/stories-feed/feed/:id"
              element={<div>Feed Details Page</div>}
            />
          </Routes>
        </MemoryRouter>
      </ConfirmProvider>,
    );
  };

  it("renders loading states initially", () => {
    adminService.getStoriesFeedStats.mockImplementation(
      () => new Promise(() => {}),
    );
    adminService.getStories.mockImplementation(() => new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/Loading stories…/i)).toBeInTheDocument();
  });

  it("fetches and displays stats and stories successfully", async () => {
    adminService.getStoriesFeedStats.mockResolvedValue({ data: mockStats });
    adminService.getStories.mockResolvedValue({ data: mockStories });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("15")).toBeInTheDocument(); // total stories
      expect(screen.getByText("20")).toBeInTheDocument(); // total feeds
      expect(screen.getByText("Story 1")).toBeInTheDocument();
      expect(screen.getByText("Story 2")).toBeInTheDocument();
    });
  });

  it("handles errors when fetching data", async () => {
    adminService.getStoriesFeedStats.mockRejectedValue(
      new Error("Stats error"),
    );
    adminService.getStories.mockRejectedValue(new Error("Fetch error"));

    renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch stories");
    });
  });

  it("switches to feeds tab and displays feeds", async () => {
    adminService.getStoriesFeedStats.mockResolvedValue({ data: mockStats });
    adminService.getStories.mockResolvedValue({ data: mockStories });
    adminService.getFeeds.mockResolvedValue({ data: mockFeeds });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Story 1")).toBeInTheDocument();
    });

    const feedTab = screen.getByRole("button", { name: /Community Feed/i });
    fireEvent.click(feedTab);

    await waitFor(() => {
      expect(adminService.getFeeds).toHaveBeenCalled();
      expect(screen.getByText("Feed 1")).toBeInTheDocument();
    });
  });

  it("filters by type", async () => {
    adminService.getStoriesFeedStats.mockResolvedValue({ data: mockStats });
    adminService.getStories.mockResolvedValue({ data: mockStories });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Story 1")).toBeInTheDocument();
    });

    const newsFilterBtn = screen.getByRole("button", { name: "News" });
    fireEvent.click(newsFilterBtn);

    await waitFor(() => {
      expect(adminService.getStories).toHaveBeenCalledWith(
        expect.objectContaining({ type: "News" }),
      );
    });
  });

  it("searches for stories", async () => {
    adminService.getStoriesFeedStats.mockResolvedValue({ data: mockStats });
    adminService.getStories.mockResolvedValue({ data: mockStories });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Story 1")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search stories…");
    fireEvent.change(searchInput, { target: { value: "Story 1" } });

    await waitFor(() => {
      expect(adminService.getStories).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Story 1" }),
      );
    });
  });

  it("navigates to story details", async () => {
    adminService.getStoriesFeedStats.mockResolvedValue({ data: mockStats });
    adminService.getStories.mockResolvedValue({ data: mockStories });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Story 1")).toBeInTheDocument();
    });

    const storyCard = screen.getByText("Story 1");
    fireEvent.click(storyCard);

    await waitFor(() => {
      expect(screen.getByText("Story Details Page")).toBeInTheDocument();
    });
  });

  it("navigates to feed details", async () => {
    adminService.getStoriesFeedStats.mockResolvedValue({ data: mockStats });
    adminService.getStories.mockResolvedValue({ data: mockStories });
    adminService.getFeeds.mockResolvedValue({ data: mockFeeds });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Story 1")).toBeInTheDocument();
    });

    const feedTab = screen.getByRole("button", { name: /Community Feed/i });
    fireEvent.click(feedTab);

    await waitFor(() => {
      expect(screen.getByText("Feed 1")).toBeInTheDocument();
    });

    const feedCard = screen.getByText("Feed 1");
    fireEvent.click(feedCard);

    await waitFor(() => {
      expect(screen.getByText("Feed Details Page")).toBeInTheDocument();
    });
  });

  it("deletes a story", async () => {
    adminService.getStoriesFeedStats.mockResolvedValue({ data: mockStats });
    adminService.getStories.mockResolvedValue({ data: mockStories });
    adminService.deleteStory.mockResolvedValue({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Story 1")).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByRole("button", {
      name: /Delete Content/i,
    });
    fireEvent.click(deleteBtns[0]);

    // Confirm deletion
    const confirmBtn = await screen.findByRole("button", {
      name: /Delete Permanently/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminService.deleteStory).toHaveBeenCalledWith("story1");
      expect(toast.success).toHaveBeenCalledWith("Story deleted successfully");
    });
  });

  it("deletes a feed post", async () => {
    adminService.getStoriesFeedStats.mockResolvedValue({ data: mockStats });
    adminService.getStories.mockResolvedValue({ data: mockStories });
    adminService.getFeeds.mockResolvedValue({ data: mockFeeds });
    adminService.deleteFeed.mockResolvedValue({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Story 1")).toBeInTheDocument();
    });

    const feedTab = screen.getByRole("button", { name: /Community Feed/i });
    fireEvent.click(feedTab);

    await waitFor(() => {
      expect(screen.getByText("Feed 1")).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByRole("button", {
      name: /Delete Content/i,
    });
    fireEvent.click(deleteBtns[0]);

    // Confirm deletion
    const confirmBtn = await screen.findByRole("button", {
      name: /Delete Permanently/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminService.deleteFeed).toHaveBeenCalledWith("feed1");
      expect(toast.success).toHaveBeenCalledWith(
        "Feed post deleted successfully",
      );
    });
  });

  it("cancels deletion", async () => {
    adminService.getStoriesFeedStats.mockResolvedValue({ data: mockStats });
    adminService.getStories.mockResolvedValue({ data: mockStories });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Story 1")).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByRole("button", {
      name: /Delete Content/i,
    });
    fireEvent.click(deleteBtns[0]);

    // Cancel deletion
    const cancelBtn = await screen.findByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(adminService.deleteStory).not.toHaveBeenCalled();
  });

  it("handles error when deleting a story", async () => {
    adminService.getStoriesFeedStats.mockResolvedValue({ data: mockStats });
    adminService.getStories.mockResolvedValue({ data: mockStories });
    adminService.deleteStory.mockRejectedValue(new Error("Delete error"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Story 1")).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByRole("button", {
      name: /Delete Content/i,
    });
    fireEvent.click(deleteBtns[0]);

    // Confirm deletion
    const confirmBtn = await screen.findByRole("button", {
      name: /Delete Permanently/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Delete failed");
    });
  });

  it("shows no stories found state", async () => {
    adminService.getStoriesFeedStats.mockResolvedValue({ data: mockStats });
    adminService.getStories.mockResolvedValue({
      data: { stories: [], totalPages: 0 },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("No stories found")).toBeInTheDocument();
    });
  });
});
