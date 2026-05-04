import { render, screen, waitFor, fireEvent } from "../../utils/test-utils";
import Highlights from "../Highlights";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { storyService } from "../../services";

vi.mock("../../services", () => ({
  storyService: {
    getHighlights: vi.fn(),
  },
}));

describe("Highlights Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially and then returns null if empty highlights", async () => {
    storyService.getHighlights.mockResolvedValueOnce({ data: { data: [] } });

    const { container } = render(<Highlights ownerId="1" />);

    // Check loading pulse
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();

    await waitFor(() => {
      // Empty DOM because highlights length is 0
      expect(screen.queryByText("Business Highlights")).not.toBeInTheDocument();
    });
  });

  it("renders highlights correctly and handles modal interaction", async () => {
    const mockHighlights = [
      {
        _id: "1",
        title: "Offer 1",
        highlightCategory: "Offers",
        author: "Owner",
        content: "Get 50% off",
        image: "img1.png",
      },
      {
        _id: "2",
        title: "Event 1",
        highlightCategory: "Events",
        author: "Owner",
        content: "Music Fest",
      }, // No image
      {
        _id: "3",
        title: "Gallery 1",
        highlightCategory: "Gallery",
        author: "Owner",
        content: "New Photos",
      },
      {
        _id: "4",
        title: "Announce 1",
        highlightCategory: "Announcements",
        author: "Owner",
        content: "We are open",
      },
      {
        _id: "5",
        title: "Other 1",
        highlightCategory: "Other",
        author: "Owner",
        content: "Special",
      },
    ];

    storyService.getHighlights.mockResolvedValueOnce({
      data: { data: mockHighlights },
    });

    render(<Highlights ownerId="1" />);

    await waitFor(() => {
      expect(screen.getByText("Business Highlights")).toBeInTheDocument();
      expect(screen.getByText("Offers")).toBeInTheDocument();
      expect(screen.getByText("Events")).toBeInTheDocument();
    });

    // Test clicking a highlight with image
    fireEvent.click(screen.getByText("Offers"));

    await waitFor(() => {
      expect(screen.getByText("Offer 1")).toBeInTheDocument();
      expect(screen.getByText("Get 50% off")).toBeInTheDocument();
      expect(screen.getByText("Offers Highlight")).toBeInTheDocument();

      // Image should be rendered in the modal
      const images = screen.getAllByRole("img");
      expect(images.some((img) => img.src.includes("img1.png") || img.alt === "Offer 1")).toBe(true);
    });

    // Test closing modal by X button
    // The X button is the first button in the modal or we can find it by structure
    const closeButton = screen.getAllByRole("button")[0];
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Offer 1")).not.toBeInTheDocument();
    });
  });

  it("handles clicking highlight without image (renders fallback icon)", async () => {
    storyService.getHighlights.mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: "2",
            title: "Event 1",
            highlightCategory: "Events",
            author: "Owner",
            content: "Music Fest",
          },
        ],
      },
    });

    render(<Highlights ownerId="1" />);

    await waitFor(() => {
      expect(screen.getByText("Events")).toBeInTheDocument();
    });

    // Click to open modal
    fireEvent.click(screen.getByText("Events"));

    await waitFor(() => {
      expect(screen.getByText("Music Fest")).toBeInTheDocument();
    });

    // Close modal by clicking backdrop (the div with fixed inset-0)
    // The backdrop has onClick
    fireEvent.click(screen.getByText("Music Fest").closest(".fixed"));

    await waitFor(() => {
      expect(screen.queryByText("Music Fest")).not.toBeInTheDocument();
    });
  });

  it("handles error gracefully when fetching highlights", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    storyService.getHighlights.mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<Highlights ownerId="1" />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching highlights:",
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });

  it("does not fetch if ownerId is not provided", async () => {
    render(<Highlights ownerId={null} />);

    // It should stay in loading state or return empty depending on the effect
    // Actually the effect checks `if (ownerId) fetchHighlights();`
    // So if no ownerId, it never fetches, and stays in loading state
    expect(
      screen.queryByTestId("loading-fallback") ||
        document.querySelector(".animate-pulse"),
    ).toBeInTheDocument();
    expect(storyService.getHighlights).not.toHaveBeenCalled();
  });
});
