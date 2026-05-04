import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import SubCategories from "../SubCategories";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { categories } from "../../data/categories";
import { toast } from "react-hot-toast";

// Mock react-router-dom
const mockParams = { categoryName: "Daily Needs" };
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => mockParams,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../context/UserContext", () => ({
  useUser: vi.fn(() => ({
    user: {
      id: "u1",
      name: "Test User",
      locationName: "Ahmedabad",
    },
  })),
}));

vi.mock("../../context/LocationContext", () => ({
  useLocation: vi.fn(() => ({ district: "Ahmedabad", taluka: "City" })),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("SubCategories Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.categoryName = "Daily Needs";
  });

  it("renders category and its subcategories with location info", () => {
    const category = categories.find((c) => c.name === "Daily Needs");
    render(<SubCategories />);

    expect(screen.getByText(category.name)).toBeDefined();
    expect(
      screen.getByText(
        new RegExp(`${category.subcategories.length}\\s+sub-categories`, "i"),
      ),
    ).toBeDefined();
    expect(screen.getByText(/Ahmedabad/i)).toBeDefined();

    // Check first subcategory
    expect(screen.getByText(category.subcategories[0].name)).toBeDefined();
  });

  it("filters subcategories by search and shows result count", () => {
    const category = categories.find((c) => c.name === "Daily Needs");
    render(<SubCategories />);

    const searchInput = screen.getByPlaceholderText(/Search sub-categories/i);
    const firstSubName = category.subcategories[0].name;
    fireEvent.change(searchInput, { target: { value: firstSubName } });

    expect(screen.getByText(firstSubName)).toBeDefined();
    expect(screen.getByText(/1 result/i)).toBeDefined();

    if (category.subcategories.length > 1) {
      expect(screen.queryByText(category.subcategories[1].name)).toBeNull();
    }
  });

  it("clears search when X button is clicked", () => {
    render(<SubCategories />);
    const searchInput = screen.getByPlaceholderText(/Search sub-categories/i);
    fireEvent.change(searchInput, { target: { value: "Something" } });

    const clearBtn = screen.getByRole("button", { name: "" }); // The X mark
    fireEvent.click(clearBtn);

    expect(searchInput.value).toBe("");
  });

  it("handles subcategory selection when location is present", () => {
    render(<SubCategories />);
    const category = categories.find((c) => c.name === "Daily Needs");
    const subCard = screen.getByText(category.subcategories[0].name);
    fireEvent.click(subCard);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/services/Daily Needs/${category.subcategories[0].name}`,
    );
  });


  it('shows "No sub-categories found" for invalid search', () => {
    render(<SubCategories />);
    const searchInput = screen.getByPlaceholderText(/Search sub-categories/i);
    fireEvent.change(searchInput, { target: { value: "NonExistentCategory" } });

    expect(screen.getByText(/No sub-categories found/i)).toBeDefined();

    const clearBtn = screen.getByText(/Clear Search/i);
    fireEvent.click(clearBtn);
    expect(searchInput.value).toBe("");
  });

  it("shows error state when category not found", () => {
    mockParams.categoryName = "Unknown";
    render(<SubCategories />);
    expect(screen.getByText(/Category Not Found/i)).toBeDefined();

    const returnBtn = screen.getByText(/Return to Directory/i);
    fireEvent.click(returnBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/explore");
  });

  it('navigates back on "Back to Directory" click', () => {
    render(<SubCategories />);
    const backBtn = screen.getByText(/Back to Directory/i);
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
