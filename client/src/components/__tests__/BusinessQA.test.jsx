import { render, screen, waitFor, fireEvent } from "../../utils/test-utils";
import BusinessQA from "../BusinessQA";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { qaService } from "../../services";
import { useUser } from "../../context/UserContext";

vi.mock("../../services", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    qaService: {
      getQuestions: vi.fn(),
      postQuestion: vi.fn(),
      postAnswer: vi.fn(),
      deleteQuestion: vi.fn(),
      upvoteQuestion: vi.fn(),
    },
  };
});

vi.mock("../../context/UserContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: vi.fn(),
  };
});

describe("BusinessQA Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    useUser.mockReturnValue({ user: null });
    qaService.getQuestions.mockReturnValue(new Promise(() => {}));
    render(<BusinessQA businessId="1" />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("handles error when fetching questions", async () => {
    useUser.mockReturnValue({ user: null });
    qaService.getQuestions.mockRejectedValue(new Error("Network error"));
    render(<BusinessQA businessId="1" />);

    await waitFor(() => {
      expect(
        screen.getByText("No questions yet — be the first to ask!"),
      ).toBeInTheDocument();
    });
    // In actual implementation toast.error("Failed to load questions") is called
  });

  it("renders questions and unanswered badge for owner", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    qaService.getQuestions.mockResolvedValueOnce({
      data: [
        {
          _id: "q1",
          question: "Test Q?",
          answers: [],
          upvotes: [],
          askedByName: "User",
          askedBy: "u2",
        },
      ],
    });

    render(<BusinessQA businessId="1" isOwner={true} />);

    await waitFor(() => {
      expect(screen.getByText("Test Q?")).toBeInTheDocument();
      expect(screen.getByText("1 unanswered")).toBeInTheDocument();
      expect(
        screen.getByText(
          "As the business owner, you can answer questions but cannot post them yourself.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows login button if not logged in", async () => {
    useUser.mockReturnValue({ user: null });
    qaService.getQuestions.mockResolvedValueOnce({ data: [] });

    render(<BusinessQA businessId="1" />);

    await waitFor(() => {
      expect(screen.getByText("Login to Ask")).toBeInTheDocument();
    });
  });

  it("allows authenticated user to post a question", async () => {
    useUser.mockReturnValue({ user: { id: "u1", name: "Test User" } });
    qaService.getQuestions.mockResolvedValueOnce({ data: [] });
    qaService.postQuestion.mockResolvedValueOnce({ data: { success: true } });

    render(<BusinessQA businessId="1" />);

    await waitFor(() =>
      screen.getByPlaceholderText(/e.g. What are your working hours/i),
    );

    const input = screen.getByPlaceholderText(
      /e.g. What are your working hours/i,
    );
    fireEvent.change(input, { target: { value: "New Question?" } });

    const postBtn = screen.getByRole("button", { name: /Post/i });
    fireEvent.click(postBtn);

    await waitFor(() => {
      expect(qaService.postQuestion).toHaveBeenCalledWith("1", "New Question?");
    });
  });

  it("allows owner to answer a question", async () => {
    useUser.mockReturnValue({ user: { id: "owner1" } });
    qaService.getQuestions.mockResolvedValueOnce({
      data: [
        {
          _id: "q1",
          question: "Test Q?",
          answers: [],
          upvotes: [],
          askedByName: "User",
          askedBy: "u2",
        },
      ],
    });
    qaService.postAnswer.mockResolvedValueOnce({ data: { success: true } });

    render(<BusinessQA businessId="1" isOwner={true} />);

    await waitFor(() => screen.getByText("Test Q?"));

    // Expand question
    fireEvent.click(screen.getByText("Test Q?"));

    await waitFor(() => screen.getByPlaceholderText("Reply as owner…"));

    const input = screen.getByPlaceholderText("Reply as owner…");
    fireEvent.change(input, { target: { value: "Here is the answer" } });

    const replyBtn = screen.getByRole("button", { name: /Reply/i });
    fireEvent.click(replyBtn);

    await waitFor(() => {
      expect(qaService.postAnswer).toHaveBeenCalledWith(
        "1",
        "q1",
        "Here is the answer",
      );
    });
  });

  it("allows user to upvote a question", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    qaService.getQuestions.mockResolvedValueOnce({
      data: [
        {
          _id: "q1",
          question: "Test Q?",
          answers: [],
          upvotes: [],
          askedByName: "User",
          askedBy: "u2",
        },
      ],
    });
    qaService.upvoteQuestion.mockResolvedValueOnce({ data: { upvoted: true } });

    render(<BusinessQA businessId="1" />);

    await waitFor(() => screen.getByText("Test Q?"));

    // The upvote button is the one with the arrow up
    const upvoteBtn = screen
      .getAllByRole("button")
      .find((b) => b.className.includes("min-w-11"));
    fireEvent.click(upvoteBtn);

    await waitFor(() => {
      expect(qaService.upvoteQuestion).toHaveBeenCalledWith("q1");
    });
  });

  it("allows user to delete their own question", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    qaService.getQuestions.mockResolvedValueOnce({
      data: [
        {
          _id: "q1",
          question: "Test Q?",
          answers: [],
          upvotes: [],
          askedByName: "User",
          askedBy: "u1",
        },
      ],
    });
    qaService.deleteQuestion.mockResolvedValueOnce({ data: { success: true } });

    render(<BusinessQA businessId="1" />);

    await waitFor(() => screen.getByText("Test Q?"));

    // Find delete button
    const deleteBtn = screen
      .getAllByRole("button")
      .find(
        (b) =>
          b.innerHTML.includes("HiOutlineTrash") ||
          b.className.includes("hover:text-rose-400"),
      );
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(qaService.deleteQuestion).toHaveBeenCalledWith("q1");
      expect(screen.queryByText("Test Q?")).not.toBeInTheDocument();
    });
  });
});
