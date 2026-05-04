import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import ReportModal from "../ReportModal";
import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "../../services/api";
import { toast } from "react-hot-toast";

vi.mock("../../services/api");
vi.mock("react-hot-toast");

describe("ReportModal Component", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing if not open", () => {
    render(
      <ReportModal
        isOpen={false}
        onClose={onClose}
        targetType="user"
        targetId="1"
      />,
    );
    expect(screen.queryByText("Report Content")).not.toBeInTheDocument();
  });

  it("renders modal when open", () => {
    render(
      <ReportModal
        isOpen={true}
        onClose={onClose}
        targetType="user"
        targetId="1"
      />,
    );
    expect(screen.getByText("Report Content")).toBeInTheDocument();
    expect(screen.getByText("Spam")).toBeInTheDocument();
  });

  it("prevents submission if no reason selected", () => {
    render(
      <ReportModal
        isOpen={true}
        onClose={onClose}
        targetType="user"
        targetId="1"
      />,
    );

    fireEvent.click(screen.getByText("Submit Report"));

    expect(toast.error).toHaveBeenCalledWith("Please select a reason");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("submits report successfully and closes modal", async () => {
    api.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <ReportModal
        isOpen={true}
        onClose={onClose}
        targetType="user"
        targetId="1"
      />,
    );

    // Select a reason
    fireEvent.click(screen.getByText("Spam"));

    // Enter description
    fireEvent.change(screen.getByPlaceholderText(/Tell us more/), {
      target: { value: "Spamming posts" },
    });

    // Submit
    fireEvent.click(screen.getByText("Submit Report"));

    expect(screen.getByText("Submitting...")).toBeInTheDocument();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/reports", {
        targetType: "user",
        targetId: "1",
        reason: "Spam",
        description: "Spamming posts",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Thank you for your report. Our team will review it.",
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("handles submission error", async () => {
    api.post.mockRejectedValueOnce(new Error("Failed to submit"));

    render(
      <ReportModal
        isOpen={true}
        onClose={onClose}
        targetType="user"
        targetId="1"
      />,
    );

    fireEvent.click(screen.getByText("Spam"));
    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to submit report");
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByText("Submit Report")).toBeInTheDocument(); // Loading stopped
    });
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <ReportModal
        isOpen={true}
        onClose={onClose}
        targetType="user"
        targetId="1"
      />,
    );

    const closeBtn = screen.getByRole("button", { name: "" }); // Uses FiX icon, we can target it better
    const buttons = screen.getAllByRole("button");
    // First button in the DOM after the reasons is the close button? No, it's in the header.
    // It's the first button actually, let's just click it
    fireEvent.click(buttons[0]);

    expect(onClose).toHaveBeenCalled();
  });
});
