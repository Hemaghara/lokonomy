import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import PostStory from "../PostStory";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { storyService } from "../../services";
import { toast } from "react-hot-toast";

// Mock storyService
vi.mock("../../services", () => ({
  storyService: {
    createStory: vi.fn(),
  },
}));

// Mock MapPicker
vi.mock("../../components/MapPicker", () => ({
  default: ({ onChange }) => (
    <div data-testid="map-picker">
      <button
        type="button"
        onClick={() =>
          onChange({
            lat: 12.34,
            lng: 56.78,
            address: "Test Address",
            pincode: "123456",
          })
        }
      >
        Select Location
      </button>
    </div>
  ),
}));

vi.mock("../../hooks/usePlanLimits", () => ({
  usePlanLimits: () => ({ limits: { storiesPosted: 5 } }),
}));

vi.mock("react-hot-toast", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

describe("PostStory Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storyService.createStory.mockResolvedValue({
      data: { success: true, message: "Broadcasted successfully!" },
    });
  });

  it("renders the broadcast form with limits", () => {
    render(<PostStory />);
    expect(screen.getByText(/Share Local Update/i)).toBeInTheDocument();
    expect(screen.getByText(/Remaining: 5 \/ 5/i)).toBeInTheDocument();
  });

  it("validates location selection before submission", async () => {
    render(<PostStory />);

    fireEvent.change(screen.getByLabelText(/Title \/ Subject/i), {
      target: { name: "title", value: "Test Title" },
    });
    fireEvent.change(screen.getByLabelText(/Content Description/i), {
      target: { name: "content", value: "Test Content" },
    });

    const submitBtn = screen.getByRole("button", { name: /Broadcast Update/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please select a location on the map for your broadcast.",
      );
      expect(storyService.createStory).not.toHaveBeenCalled();
    });
  });

  it("submits the form successfully with all data", async () => {
    render(<PostStory />);

    // Select location
    fireEvent.click(screen.getByText("Select Location"));

    fireEvent.change(screen.getByLabelText(/Title \/ Subject/i), {
      target: { name: "title", value: "Community Event" },
    });
    fireEvent.change(screen.getByLabelText(/Content Description/i), {
      target: { name: "content", value: "Coming soon!" },
    });

    // Select category
    fireEvent.click(screen.getByText("News")); // Default
    fireEvent.click(screen.getByText("Events"));

    const submitBtn = screen.getByRole("button", { name: /Broadcast Update/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(storyService.createStory).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Community Event",
          type: "Events",
          latitude: 12.34,
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Broadcasted successfully!");
    });
  });

  it("prevents highlight toggle for free members", async () => {
    // Default user in test-utils is 'free'
    render(<PostStory />);

    const highlightToggle = screen.getByLabelText(/Pin to Highlights/i);
    fireEvent.click(highlightToggle);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Story Highlights are only available for Gold and Platinum members!",
      );
      expect(highlightToggle).not.toBeChecked();
    });
  });

  it('handles "LIMIT_REACHED" error', async () => {
    storyService.createStory.mockRejectedValueOnce({
      response: { data: { code: "LIMIT_REACHED", message: "Out of stories" } },
    });

    render(<PostStory />);
    fireEvent.click(screen.getByText("Select Location"));
    fireEvent.change(screen.getByLabelText(/Title \/ Subject/i), {
      target: { name: "title", value: "Limit Test" },
    });
    fireEvent.change(screen.getByLabelText(/Content Description/i), {
      target: { name: "content", value: "Limit Content" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Broadcast Update/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });
  });

  it("handles image upload and preview", async () => {
    render(<PostStory />);

    const file = new File(["img"], "story.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/Click to upload an image/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAltText("Preview")).toBeInTheDocument();
    });
  });
});
