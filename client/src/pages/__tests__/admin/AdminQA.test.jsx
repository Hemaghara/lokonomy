import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminQA from "../../admin/AdminQA";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock AdminLayout
vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

// Mock adminService
vi.mock("../../../services", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    adminService: {
      ...actual.adminService,
      getQA: vi.fn(),
      deleteQuestion: vi.fn(),
      togglePinQA: vi.fn(),
    },
  };
});

const mockQAData = {
  data: {
    qas: [
      {
        _id: "qa1",
        question: "What are the hours?",
        askedByName: "John Doe",
        businessName: "Bakery A",
        isPinned: false,
        answers: [
          {
            answer: "9 AM to 5 PM",
            answeredByName: "Owner",
            isOwner: true,
            createdAt: new Date("2023-01-01").toISOString(),
          },
        ],
      },
      {
        _id: "qa2",
        question: "Do you deliver?",
        askedByName: "Alice",
        businessName: "Bakery A",
        isPinned: true,
        answers: [],
      },
    ],
    stats: { total: 10, answered: 8, unanswered: 2 },
  },
};

describe("AdminQA Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockImplementation(() => true);

    adminService.getQA.mockResolvedValue(mockQAData);
    adminService.deleteQuestion.mockResolvedValue({ data: { success: true } });
    adminService.togglePinQA.mockResolvedValue({ data: { success: true } });
  });

  it("renders loading state initially", async () => {
    adminService.getQA.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockQAData), 100)),
    );
    render(<AdminQA />);
    expect(screen.getByTestId("admin-layout")).toBeInTheDocument();
  });

  it("renders QA list and stats correctly", async () => {
    render(<AdminQA />);

    await waitFor(() => {
      expect(screen.getByText("What are the hours?")).toBeInTheDocument();
      expect(screen.getByText("Do you deliver?")).toBeInTheDocument();
      expect(screen.getByText("Total Questions")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument(); // total
      expect(screen.getByText("8")).toBeInTheDocument(); // answered
      expect(screen.getByText("2")).toBeInTheDocument(); // unanswered
    });
  });


  it("handles empty state correctly", async () => {
    adminService.getQA.mockResolvedValueOnce({
      data: { qas: [], stats: { total: 0, answered: 0, unanswered: 0 } },
    });
    render(<AdminQA />);

    await waitFor(() => {
      expect(
        screen.getByText(/No questions matched your search/i),
      ).toBeInTheDocument();
    });
  });

  it("handles API failure during fetch", async () => {
    adminService.getQA.mockRejectedValueOnce(new Error("Network error"));
    render(<AdminQA />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch QA data");
    });
  });

  it("handles filtering by status", async () => {
    render(<AdminQA />);

    const filterSelect = screen.getByRole("combobox");
    fireEvent.change(filterSelect, { target: { value: "no" } });

    await waitFor(() => {
      expect(adminService.getQA).toHaveBeenCalledWith(
        expect.objectContaining({
          answered: "no",
        }),
      );
    });

    fireEvent.change(filterSelect, { target: { value: "yes" } });

    await waitFor(() => {
      expect(adminService.getQA).toHaveBeenCalledWith(
        expect.objectContaining({
          answered: "yes",
        }),
      );
    });
  });

  it("handles search input on Enter", async () => {
    render(<AdminQA />);

    const searchInput = screen.getByPlaceholderText(
      /Search by question text or user name/i,
    );
    fireEvent.change(searchInput, { target: { value: "hours" } });
    fireEvent.keyPress(searchInput, { key: "Enter", code: 13, charCode: 13 });

    await waitFor(() => {
      expect(adminService.getQA).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "hours",
        }),
      );
    });
  });

  it("handles deleting a question successfully", async () => {
    render(<AdminQA />);

    await screen.findByText("What are the hours?");

    const deleteBtns = screen.getAllByLabelText("Delete question");
    fireEvent.click(deleteBtns[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      "Delete this question permanently?",
    );

    await waitFor(() => {
      expect(adminService.deleteQuestion).toHaveBeenCalledWith("qa1");
      expect(toast.success).toHaveBeenCalledWith("Question deleted");
      expect(adminService.getQA).toHaveBeenCalledTimes(2); // re-fetch
    });
  });

  it("does not delete question if confirmation is rejected", async () => {
    vi.spyOn(window, "confirm").mockImplementationOnce(() => false);
    render(<AdminQA />);

    await screen.findByText("What are the hours?");

    const deleteBtns = screen.getAllByLabelText("Delete question");
    fireEvent.click(deleteBtns[0]);

    expect(adminService.deleteQuestion).not.toHaveBeenCalled();
  });

  it("handles error when deleting a question", async () => {
    adminService.deleteQuestion.mockRejectedValueOnce(
      new Error("Delete Failed"),
    );
    render(<AdminQA />);

    await screen.findByText("What are the hours?");

    const deleteBtns = screen.getAllByLabelText("Delete question");
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Deletion failed");
    });
  });

  it("handles toggling pin status successfully", async () => {
    render(<AdminQA />);

    await screen.findByText("What are the hours?");

    const pinBtn = screen.getAllByLabelText("Pin question")[0];
    fireEvent.click(pinBtn);

    await waitFor(() => {
      expect(adminService.togglePinQA).toHaveBeenCalledWith("qa1");
      expect(toast.success).toHaveBeenCalledWith("Pin status toggled");
      expect(adminService.getQA).toHaveBeenCalledTimes(2); // re-fetch
    });
  });

  it("handles error when toggling pin status", async () => {
    adminService.togglePinQA.mockRejectedValueOnce(new Error("Pin Failed"));
    render(<AdminQA />);

    await screen.findByText("What are the hours?");

    const pinBtn = screen.getAllByLabelText("Pin question")[0];
    fireEvent.click(pinBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Operation failed");
    });
  });
});
