import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "../../utils/test-utils";
import SmartSearch from "../SmartSearch";
import { describe, it, expect, vi, beforeEach } from "vitest";
import recommendationService from "../../services/recommendationService";
import { BrowserRouter } from "react-router-dom";

vi.mock("../../services/recommendationService", () => ({
  default: {
    getSuggestions: vi.fn().mockResolvedValue([]),
    trackInteraction: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (ui) => render(ui);

describe("SmartSearch Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders search input", () => {
    renderWithRouter(<SmartSearch />);
    expect(
      screen.getByPlaceholderText(/Search for businesses/),
    ).toBeInTheDocument();
  });

  it("does not fetch suggestions if query < 2 chars", async () => {
    renderWithRouter(<SmartSearch />);

    const input = screen.getByPlaceholderText(/Search for businesses/);
    fireEvent.change(input, { target: { value: "a" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(recommendationService.getSuggestions).not.toHaveBeenCalled();
    expect(screen.queryByText(/No results found/)).not.toBeInTheDocument();
  });

  it("fetches and displays suggestions after debounce", async () => {
    const mockSuggestions = [
      { id: "1", text: "Test Business", type: "business" },
      { id: "2", text: "Test Product", type: "product" },
      { id: "3", text: "Test Job", type: "job" },
    ];
    recommendationService.getSuggestions.mockResolvedValueOnce(mockSuggestions);

    renderWithRouter(<SmartSearch />);

    const input = screen.getByPlaceholderText(/Search for businesses/);
    fireEvent.change(input, { target: { value: "test" } });

    // Fast-forward debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(recommendationService.getSuggestions).toHaveBeenCalledWith("test");
      expect(screen.getByText("Test Business")).toBeInTheDocument();
      expect(screen.getByText("Test Product")).toBeInTheDocument();
      expect(screen.getByText("Test Job")).toBeInTheDocument();
    });
  });

  it("displays no results message if empty array returned", async () => {
    recommendationService.getSuggestions.mockResolvedValueOnce([]);

    renderWithRouter(<SmartSearch />);

    const input = screen.getByPlaceholderText(/Search for businesses/);
    fireEvent.change(input, { target: { value: "nothing" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(
        screen.getByText('No results found for "nothing"'),
      ).toBeInTheDocument();
    });
  });

  it("handles API error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    recommendationService.getSuggestions.mockRejectedValueOnce(
      new Error("Network Error"),
    );

    renderWithRouter(<SmartSearch />);

    const input = screen.getByPlaceholderText(/Search for businesses/);
    fireEvent.change(input, { target: { value: "error" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Search suggestion error:",
        expect.any(Error),
      );
      expect(document.querySelector(".animate-spin")).not.toBeInTheDocument(); // loading is false
    });
    consoleSpy.mockRestore();
  });

  it("navigates and tracks interaction on select", async () => {
    recommendationService.getSuggestions.mockResolvedValueOnce([
      { id: "1", text: "Test Business", type: "business" },
    ]);

    renderWithRouter(<SmartSearch />);

    const input = screen.getByPlaceholderText(/Search for businesses/);
    fireEvent.change(input, { target: { value: "test" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Business")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Test Business").closest("button"));

    expect(recommendationService.trackInteraction).toHaveBeenCalledWith(
      "click",
      "business",
      "1",
    );
    expect(mockNavigate).toHaveBeenCalledWith("/business/1");

    // Should clear query and hide dropdown
    expect(input.value).toBe("");
    expect(screen.queryByText("Test Business")).not.toBeInTheDocument();
  });

  it("hides dropdown when clicking outside", async () => {
    recommendationService.getSuggestions.mockResolvedValueOnce([
      { id: "1", text: "Test Business", type: "business" },
    ]);

    render(
      <div>
        <div data-testid="outside">Outside</div>
        <SmartSearch />
      </div>
    );

    const input = screen.getByPlaceholderText(/Search for businesses/);
    fireEvent.change(input, { target: { value: "test" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Business")).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByTestId("outside"));

    await waitFor(() => {
      expect(screen.queryByText("Test Business")).not.toBeInTheDocument();
    });
  });

  it("shows dropdown on focus if query >= 2", async () => {
    recommendationService.getSuggestions.mockResolvedValueOnce([
      { id: "1", text: "Test Business", type: "business" },
    ]);
    renderWithRouter(<SmartSearch />);

    const input = screen.getByPlaceholderText(/Search for businesses/);
    fireEvent.change(input, { target: { value: "test" } });

    // Fast-forward debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Business")).toBeInTheDocument();
    });

    // Simulate clicking outside to hide
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });
    
    expect(screen.queryByText("Test Business")).not.toBeInTheDocument();

    // Refocus
    fireEvent.focus(input);
    
    expect(screen.getByText("Test Business")).toBeInTheDocument();
  });
});
