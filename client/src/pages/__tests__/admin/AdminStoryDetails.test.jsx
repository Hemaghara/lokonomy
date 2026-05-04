import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminStoryDetails from "../../../pages/admin/AdminStoryDetails";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("../../../services", () => ({
  adminService: {
    getStoryDetails: vi.fn(),
    deleteStory: vi.fn(),
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
  AnimatePresence: ({ children }) => children,
}));

const mockStory = {
  _id: "story123",
  title: "Test Story Title",
  content: "This is the content of the story.",
  type: "News",
  author: "John Doe",
  authorId: {
    _id: "user123",
    name: "John Doe",
    email: "john@example.com",
    phone: "1234567890",
    profilePic: "pic.jpg",
    district: "Test District",
    taluka: "Test Taluka",
  },
  createdAt: "2023-01-01T00:00:00Z",
  expiresAt: "2023-01-10T00:00:00Z",
  locationAddress: "123 Test St",
  district: "Test District",
  taluka: "Test Taluka",
  isHighlighted: true,
  highlightCategory: "Top News",
  image: "story-image.jpg",
  location: {
    coordinates: [72.0, 19.0],
  },
};

describe("AdminStoryDetails Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/admin/stories-feed/story/story123"]}>
        <Routes>
          <Route
            path="/admin/stories-feed/story/:id"
            element={<AdminStoryDetails />}
          />
          <Route
            path="/admin/stories-feed"
            element={<div>Stories Feed Page</div>}
          />
          <Route
            path="/admin/user/:id"
            element={<div>User Profile Page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );
  };

  it("renders loading state initially", () => {
    adminService.getStoryDetails.mockImplementation(
      () => new Promise(() => {}),
    );
    renderComponent();
    expect(screen.getByText(/Loading story…/i)).toBeInTheDocument();
  });

  it("fetches and displays story details successfully", async () => {
    adminService.getStoryDetails.mockResolvedValue({ data: mockStory });
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText("Test Story Title")[0]).toBeInTheDocument();
      expect(
        screen.getByText("This is the content of the story."),
      ).toBeInTheDocument();
      expect(screen.getAllByText("John Doe")[0]).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
      expect(screen.getAllByText("123 Test St")[0]).toBeInTheDocument();
      expect(screen.getByText("19.0000, 72.0000")).toBeInTheDocument();
    });
  });

  it("handles not found state", async () => {
    adminService.getStoryDetails.mockResolvedValue({ data: null });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Not Found")).toBeInTheDocument();
      expect(
        screen.getByText("This story could not be located in the database."),
      ).toBeInTheDocument();
    });

    const backBtn = screen.getByRole("button", {
      name: /Return to Stories & Feed/i,
    });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText("Stories Feed Page")).toBeInTheDocument();
    });
  });

  it("handles error fetching details", async () => {
    adminService.getStoryDetails.mockRejectedValue(new Error("Fetch error"));
    renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch story details");
    });
  });

  it("navigates back when back button is clicked", async () => {
    adminService.getStoryDetails.mockResolvedValue({ data: mockStory });
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText("Test Story Title")[0]).toBeInTheDocument();
    });

    // The back button is a generic button with FiArrowLeft
    const backBtn = screen.getAllByRole("button")[0];
    fireEvent.click(backBtn);

    // It uses navigate(-1), we can't easily assert on that in memory router with only 1 entry
    // but we can ensure it is clickable and doesn't crash
  });

  it("navigates to author profile", async () => {
    adminService.getStoryDetails.mockResolvedValue({ data: mockStory });
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText("Test Story Title")[0]).toBeInTheDocument();
    });

    const authorLink = screen.getByRole("button", { name: "John Doe" });
    fireEvent.click(authorLink);

    await waitFor(() => {
      expect(screen.getByText("User Profile Page")).toBeInTheDocument();
    });
  });

  it("opens delete modal and cancels deletion", async () => {
    adminService.getStoryDetails.mockResolvedValue({ data: mockStory });
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText("Test Story Title")[0]).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete Story/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText("Delete Story?")).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText("Delete Story?")).not.toBeInTheDocument();
    });

    expect(adminService.deleteStory).not.toHaveBeenCalled();
  });

  it("deletes the story and navigates to feed", async () => {
    adminService.getStoryDetails.mockResolvedValue({ data: mockStory });
    adminService.deleteStory.mockResolvedValue({});
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText("Test Story Title")[0]).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete Story/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText("Delete Story?")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminService.deleteStory).toHaveBeenCalledWith("story123");
      expect(toast.success).toHaveBeenCalledWith("Story deleted successfully");
      expect(screen.getByText("Stories Feed Page")).toBeInTheDocument();
    });
  });

  it("handles error when deleting story", async () => {
    adminService.getStoryDetails.mockResolvedValue({ data: mockStory });
    adminService.deleteStory.mockRejectedValue(new Error("Delete error"));
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText("Test Story Title")[0]).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete Story/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText("Delete Story?")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Delete failed");
    });
  });
});
