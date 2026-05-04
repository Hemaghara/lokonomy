import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import Feed from "../Feed";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { feedService } from "../../services";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock LocationContext
vi.mock("../../context/LocationContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useLocation: () => ({ district: "Ahmedabad", taluka: "City" }),
  };
});

// Mock UserContext
const mockUser = {
  id: "u1",
  latitude: 23.0,
  longitude: 72.5,
  locationName: "Prahlad Nagar",
};
vi.mock("../../context/UserContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: () => ({ user: mockUser }),
  };
});

// Mock react-hot-toast
vi.mock("react-hot-toast", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toast: { success: vi.fn(), error: vi.fn() },
  };
});

// Mock services
vi.mock("../../services", () => ({
  feedService: {
    getFeeds: vi.fn(),
  },
}));

// Mock ReportModal
vi.mock("../../components/ReportModal", () => ({
  default: ({ isOpen, onClose, targetId }) =>
    isOpen ? (
      <div data-testid="report-modal">
        <button onClick={onClose}>Close</button>
        <span>Reporting {targetId}</span>
      </div>
    ) : null,
}));

const mockFeeds = [
  {
    _id: "f1",
    title: "Huge Sale",
    content: "Get 50% off on all items",
    type: "Sale",
    author: "Admin",
    locationAddress: "Prahlad Nagar",
    createdAt: new Date().toISOString(),
    image: "sale.jpg",
  },
  {
    _id: "f2",
    title: "Local Meeting",
    content: "Discussion about community park",
    type: "Information",
    author: "Member 1",
    district: "Ahmedabad",
    createdAt: new Date().toISOString(),
  },
];

describe("Feed Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feedService.getFeeds.mockResolvedValue({
      data: { success: true, data: mockFeeds },
    });
  });

  it("shows loading skeletons initially", () => {
    feedService.getFeeds.mockReturnValue(new Promise(() => {}));
    render(<Feed />);
    const skeletons = screen
      .getAllByRole("generic")
      .filter((el) => el.className.includes("animate-pulse"));
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders correctly with user location", async () => {
    render(<Feed />);
    expect(screen.getByText("Community Feed")).toBeInTheDocument();
    expect(screen.getByText(/What's happening in/i)).toBeInTheDocument();
    expect(screen.getByText("Prahlad Nagar")).toBeInTheDocument();
  });

  it("fetches and displays feeds", async () => {
    render(<Feed />);
    await waitFor(() => {
      expect(screen.getByText("Huge Sale")).toBeInTheDocument();
      expect(screen.getByText("Local Meeting")).toBeInTheDocument();
    });
  });

  it("handles search input", async () => {
    render(<Feed />);
    const searchInput = screen.getByPlaceholderText(/Search local feeds/i);
    fireEvent.change(searchInput, { target: { value: "Festival" } });

    await waitFor(() => {
      expect(feedService.getFeeds).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Festival",
        }),
      );
    });
  });

  it("handles category filtering", async () => {
    render(<Feed />);
    const saleBtn = screen.getByRole("button", { name: /^Sale$/i });
    fireEvent.click(saleBtn);

    await waitFor(() => {
      expect(feedService.getFeeds).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "Sale",
        }),
      );
    });
  });

  it("handles radius filtering if user has location", async () => {
    render(<Feed />);
    const radiusSelect = screen.getByLabelText(/Radius/i);
    fireEvent.change(radiusSelect, { target: { value: "10000" } });

    await waitFor(() => {
      expect(feedService.getFeeds).toHaveBeenCalledWith(
        expect.objectContaining({
          radius: 10000,
          lat: 23.0,
          lng: 72.5,
        }),
      );
    });
  });

  it("navigates to post feed page", () => {
    render(<Feed />);
    const addBtn = screen.getByText(/Add to Feed/i);
    fireEvent.click(addBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/feed/post");
  });

  it("navigates to feed details", async () => {
    render(<Feed />);
    await waitFor(() => screen.getByText("Huge Sale"));
    const feedCard = screen.getByText("Huge Sale").closest(".group");
    fireEvent.click(feedCard);
    expect(mockNavigate).toHaveBeenCalledWith("/feed/f1");
  });

  it("opens report modal and stops propagation", async () => {
    render(<Feed />);
    await waitFor(() => screen.getByText("Huge Sale"));

    const reportBtn = screen.getAllByRole("button", { name: /Report post/i })[0];
    fireEvent.click(reportBtn);

    expect(screen.getByTestId("report-modal")).toBeInTheDocument();
    expect(screen.getByText("Reporting f1")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith("/feed/f1");
  });

  it("shows empty state when no feeds found", async () => {
    feedService.getFeeds.mockResolvedValue({
      data: { success: true, data: [] },
    });
    render(<Feed />);

    await waitFor(() => {
      expect(screen.getByText("Feed is Empty")).toBeInTheDocument();
    });
  });

  it("handles API error gracefully", async () => {
    feedService.getFeeds.mockRejectedValue(new Error("Fetch failed"));
    render(<Feed />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });
  });
});
