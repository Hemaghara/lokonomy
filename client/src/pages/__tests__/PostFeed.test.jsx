import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import PostFeed from "../PostFeed";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { feedService } from "../../services";
import { toast } from "react-hot-toast";

// Mock MapPicker
vi.mock("../../components/MapPicker", () => ({
  default: ({ onChange }) => (
    <div data-testid="map-picker">
      <button
        type="button"
        onClick={() =>
          onChange({ lat: 22.3, lng: 72.6, address: "Test Location" })
        }
      >
        Set Location
      </button>
    </div>
  ),
}));

// Mock feedService
vi.mock("../../services", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    feedService: {
      ...actual.feedService,
      createFeed: vi.fn(),
    },
  };
});

// Redundant toast mock removed to use global mock from vitest.setup.js

describe("PostFeed Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feedService.createFeed.mockResolvedValue({
      data: { success: true, message: "Posted successfully" },
    });
  });

  it("handles basic form input and dropdown", async () => {
    render(<PostFeed />);

    const titleInput = screen.getByLabelText(/Title \/ Heading/i);
    fireEvent.change(titleInput, {
      target: { name: "title", value: "Mega Sale" },
    });
    expect(titleInput.value).toBe("Mega Sale");

    // Test CustomDropdown
    const dropdown = screen.getByText("Information"); // Default value
    fireEvent.click(dropdown);

    const saleOption = screen.getByText("Sale");
    fireEvent.click(saleOption);

    expect(screen.getByText("Sale")).toBeInTheDocument();
  });

  it("conditionally renders event date/time", async () => {
    render(<PostFeed />);

    expect(screen.queryByLabelText(/Event Date/i)).toBeNull();

    fireEvent.click(screen.getByText("Information"));
    fireEvent.click(screen.getByText("Event"));

    await waitFor(() => {
      expect(screen.getByLabelText(/Event Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Event Time/i)).toBeInTheDocument();
    });
  });

  it("handles image upload and removal", async () => {
    render(<PostFeed />);

    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    const input = screen.getByLabelText(/Click to upload an image/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAltText("Preview")).toBeInTheDocument();
    });

    const removeBtn = screen.getByText(/Remove Image/i);
    fireEvent.click(removeBtn);

    expect(screen.queryByAltText("Preview")).toBeNull();
  });

  it("submits form successfully with all data", async () => {
    render(<PostFeed />);

    fireEvent.change(screen.getByLabelText(/Title \/ Heading/i), {
      target: { value: "Test Post" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Detailed content" },
    });

    // Set location
    fireEvent.click(screen.getByText("Set Location"));

    const submitBtn = screen.getByRole("button", { name: /Post to Feed/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(feedService.createFeed).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Post",
          content: "Detailed content",
          latitude: 22.3,
          locationAddress: "Test Location",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Posted successfully");
    });
  });

  it("shows error if location is missing", async () => {
    render(<PostFeed />);

    fireEvent.change(screen.getByLabelText(/Title \/ Heading/i), {
      target: { name: "title", value: "No Location Post" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { name: "content", value: "Detailed content" },
    });

    const submitBtn = screen.getByRole("button", { name: /Post to Feed/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please select a location on the map.",
      );
    });
    expect(feedService.createFeed).not.toHaveBeenCalled();
  });

  it("handles submission error", async () => {
    feedService.createFeed.mockRejectedValueOnce({
      response: { data: { message: "Server Overloaded" } },
    });

    render(<PostFeed />);
    fireEvent.click(screen.getByText("Set Location"));
    fireEvent.change(screen.getByLabelText(/Title \/ Heading/i), {
      target: { name: "title", value: "Error Post" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { name: "content", value: "Detailed content" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Post to Feed/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("Server Overloaded"),
      );
    });
  });

  it("closes dropdown when clicking outside", async () => {
    render(<PostFeed />);
    fireEvent.click(screen.getByText("Information"));
    expect(screen.getByText("Sale")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText("Sale")).toBeNull();
    });
  });
});
