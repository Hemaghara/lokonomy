import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminFeedDetails from "../../admin/AdminFeedDetails";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => {
      // Filter out framer-motion specific props to avoid React warnings
      const {
        initial,
        animate,
        exit,
        transition,
        whileHover,
        whileTap,
        ...rest
      } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "f1" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../services", () => ({
  adminService: {
    getFeedDetails: vi.fn(),
    deleteFeed: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockFeedData = {
  data: {
    _id: "f1",
    title: "Community Clean Up",
    type: "Event",
    content: "Join us for a clean up this weekend.",
    image: "https://example.com/image.jpg",
    author: "Alice",
    authorId: {
      _id: "u1",
      name: "Alice",
      email: "alice@example.com",
      phone: "1234567890",
      district: "North District",
      taluka: "City Center",
    },
    district: "North District",
    taluka: "City Center",
    locationAddress: "Main Park",
    location: {
      coordinates: [75.0, 25.0],
    },
    eventDate: "2023-10-15",
    eventTime: "10:00 AM",
    createdAt: new Date("2023-10-01T12:00:00Z").toISOString(),
  },
};

describe("AdminFeedDetails Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    adminService.getFeedDetails.mockReturnValue(new Promise(() => {}));
    render(<AdminFeedDetails />);
    expect(screen.getByText("Loading feed post…")).toBeInTheDocument();
  });

  it("renders not found state when feed is null", async () => {
    adminService.getFeedDetails.mockResolvedValue({ data: null });
    render(<AdminFeedDetails />);

    await screen.findByText("Not Found");
    expect(
      screen.getByText("This feed post could not be located in the database."),
    ).toBeInTheDocument();

    const backBtn = screen.getByRole("button", {
      name: /Return to Stories & Feed/i,
    });
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/admin/stories-feed");
  });

  it("renders feed details correctly", async () => {
    adminService.getFeedDetails.mockResolvedValue(mockFeedData);
    render(<AdminFeedDetails />);

    await screen.findByRole("heading", { name: /Community Clean Up/i, level: 1 });

    expect(screen.getAllByText("Event")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Main Park")[0]).toBeInTheDocument();

    
    expect(
      screen.getByText("Join us for a clean up this weekend."),
    ).toBeInTheDocument();

    
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();

    
    expect(screen.getByText("25.0000, 75.0000")).toBeInTheDocument();

    
    expect(screen.getByText("f1")).toBeInTheDocument();
    expect(screen.getByText("u1")).toBeInTheDocument();

    
    const img = screen.getByAltText("Community Clean Up");
    expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("navigates back when back button is clicked", async () => {
    adminService.getFeedDetails.mockResolvedValue(mockFeedData);
    render(<AdminFeedDetails />);

    await screen.findByRole("heading", { name: /Community Clean Up/i, level: 1 });

    const backBtn = screen.getByRole("button", { name: /Go back/i });
    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("opens and closes delete modal", async () => {
    adminService.getFeedDetails.mockResolvedValue(mockFeedData);
    render(<AdminFeedDetails />);

    await screen.findByRole("heading", { name: /Community Clean Up/i, level: 1 });

    const deleteBtn = screen.getByRole("button", { name: /Delete Feed Post/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByText("Delete Feed Post?")).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText("Delete Feed Post?")).not.toBeInTheDocument();
  });

  it("handles delete feed success", async () => {
    adminService.getFeedDetails.mockResolvedValue(mockFeedData);
    adminService.deleteFeed.mockResolvedValue({});
    render(<AdminFeedDetails />);

    await screen.findByRole("heading", { name: /Community Clean Up/i, level: 1 });

    fireEvent.click(screen.getByRole("button", { name: /Delete Feed Post/i }));

    const confirmDeleteBtn = screen.getByRole("button", { name: /^Delete$/i }); 
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(adminService.deleteFeed).toHaveBeenCalledWith("f1");
      expect(toast.success).toHaveBeenCalledWith(
        "Feed post deleted successfully",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/admin/stories-feed");
    });
  });

  it("handles delete feed error", async () => {
    adminService.getFeedDetails.mockResolvedValue(mockFeedData);
    adminService.deleteFeed.mockRejectedValue(new Error("Delete error"));
    render(<AdminFeedDetails />);

    await screen.findByRole("heading", { name: /Community Clean Up/i, level: 1 });

    fireEvent.click(screen.getByRole("button", { name: /Delete Feed Post/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Delete$/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Delete failed");
    });
  });

  it("shows error toast when fetching feed details fails", async () => {
    adminService.getFeedDetails.mockRejectedValue(new Error("Fetch error"));
    render(<AdminFeedDetails />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch feed details");
      expect(screen.getByText("Not Found")).toBeInTheDocument();
    });
  });
});
