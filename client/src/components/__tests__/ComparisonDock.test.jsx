import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import ComparisonDock from "../ComparisonDock";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useComparison } from "../../context/ComparisonContext";
import { businessService } from "../../services";
import { BrowserRouter } from "react-router-dom";

vi.mock("../../context/ComparisonContext", () => ({
  useComparison: vi.fn(() => ({
    selectedIds: [],
    toggleSelection: vi.fn(),
    clearSelection: vi.fn(),
  })),
}));

vi.mock("../../services", () => ({
  businessService: {
    getBusinessById: vi.fn(),
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

const renderWithRouter = (ui) => {
  return render(ui);
};

describe("ComparisonDock Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing if selectedIds is empty", () => {
    useComparison.mockReturnValue({
      selectedIds: [],
      toggleSelection: vi.fn(),
      clearSelection: vi.fn(),
    });
    const { container } = renderWithRouter(<ComparisonDock />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders dock with 1 selected item and placeholders", async () => {
    useComparison.mockReturnValue({
      selectedIds: ["1"],
      toggleSelection: vi.fn(),
      clearSelection: vi.fn(),
    });
    businessService.getBusinessById.mockResolvedValueOnce({
      data: { _id: "1", name: "Biz 1", logo: "logo1.png" },
    });

    renderWithRouter(<ComparisonDock />);

    await waitFor(() => {
      expect(
        screen.getByText("Select one more to unlock comparison"),
      ).toBeInTheDocument();
      // Should show the logo
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "logo1.png");
    });

    // Check for placeholders (2 placeholders if 1 selected out of 3 max)
    expect(screen.getAllByText("+")).toHaveLength(2);
  });

  it("renders dock with 2 selected items and allows navigation", async () => {
    useComparison.mockReturnValue({
      selectedIds: ["1", "2"],
      toggleSelection: vi.fn(),
      clearSelection: vi.fn(),
    });
    businessService.getBusinessById
      .mockResolvedValueOnce({ data: { _id: "1", name: "Biz 1" } }) // no logo
      .mockResolvedValueOnce({
        data: { _id: "2", name: "Biz 2", logo: "logo2.png" },
      });

    renderWithRouter(<ComparisonDock />);

    await waitFor(() => {
      expect(screen.getByText("Comparing 2 top choices")).toBeInTheDocument();
    });

    // One without logo should render emoji fallback 🏢
    expect(screen.getByText("🏢")).toBeInTheDocument();

    const launchBtn = screen.getByRole("button", { name: /Launch Analysis/i });
    expect(launchBtn).not.toBeDisabled();

    fireEvent.click(launchBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/compare?ids=1,2");
  });

  it("renders dock with 3 selected items (max limit)", async () => {
    useComparison.mockReturnValue({
      selectedIds: ["1", "2", "3"],
      toggleSelection: vi.fn(),
      clearSelection: vi.fn(),
    });
    businessService.getBusinessById.mockResolvedValue({
      data: { _id: "1", name: "Biz" },
    });

    renderWithRouter(<ComparisonDock />);

    await waitFor(() => {
      expect(screen.getByText("Comparing 3 top choices")).toBeInTheDocument();
      expect(screen.queryByText("+")).not.toBeInTheDocument(); // No placeholders
    });
  });

  it("disables launch analysis button if more than 3 selected", async () => {
    useComparison.mockReturnValue({
      selectedIds: ["1", "2", "3", "4"],
      toggleSelection: vi.fn(),
      clearSelection: vi.fn(),
    });
    businessService.getBusinessById.mockResolvedValue({
      data: { _id: "1", name: "Biz" },
    });

    renderWithRouter(<ComparisonDock />);

    await waitFor(() => {
      const launchBtn = screen.getByRole("button", {
        name: /Launch Analysis/i,
      });
      expect(launchBtn).toBeDisabled();
    });
  });

  it("calls clearSelection when reset is clicked", async () => {
    const clearSelection = vi.fn();
    useComparison.mockReturnValue({
      selectedIds: ["1"],
      toggleSelection: vi.fn(),
      clearSelection,
    });
    businessService.getBusinessById.mockResolvedValue({
      data: { _id: "1", name: "Biz 1" },
    });

    renderWithRouter(<ComparisonDock />);

    await waitFor(() => {
      const resetBtn = screen.getByRole("button", { name: /reset/i });
      fireEvent.click(resetBtn);
      expect(clearSelection).toHaveBeenCalled();
    });
  });

  it("calls toggleSelection when a business item is clicked", async () => {
    const toggleSelection = vi.fn();
    useComparison.mockReturnValue({
      selectedIds: ["1"],
      toggleSelection,
      clearSelection: vi.fn(),
    });
    businessService.getBusinessById.mockResolvedValueOnce({
      data: { _id: "1", name: "Biz 1", logo: "logo.png" },
    });

    renderWithRouter(<ComparisonDock />);

    await waitFor(() => {
      const img = screen.getByRole("img");
      // The image is inside the div with onClick
      fireEvent.click(img.parentElement);
      expect(toggleSelection).toHaveBeenCalledWith("1");
    });
  });

  it("handles fetch failure gracefully", async () => {
    useComparison.mockReturnValue({
      selectedIds: ["1"],
      toggleSelection: vi.fn(),
      clearSelection: vi.fn(),
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    businessService.getBusinessById.mockRejectedValue(
      new Error("Network error"),
    );

    renderWithRouter(<ComparisonDock />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Comparison data fetch failed",
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });
});
