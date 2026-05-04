import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import ExploreServices from "../ExploreServices";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HelmetProvider } from "react-helmet-async";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => (
      <a
        href={to}
        onClick={(e) => {
          e.preventDefault();
          mockNavigate(to);
        }}
      >
        {children}
      </a>
    ),
  };
});

// Mock LocationContext
vi.mock("../../context/LocationContext", () => ({
  LocationProvider: ({ children }) => <>{children}</>,
  useLocation: () => ({ district: "Ahmedabad", taluka: "City" }),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock categories data
vi.mock("../../data/categories", () => ({
  categories: Array(10)
    .fill(null)
    .map((_, i) => ({
      id: i + 1,
      name: `Category ${i + 1}`,
      icon: "📦",
      subcategories: [
        { name: `Sub ${i}-1`, icon: "🔹" },
        { name: `Sub ${i}-2`, icon: "🔸" },
        { name: `Sub ${i}-3`, icon: "🔹" },
        { name: `Sub ${i}-4`, icon: "🔸" },
        { name: `Sub ${i}-5`, icon: "🔹" },
      ],
    })),
}));

describe("ExploreServices Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <HelmetProvider>
        <ExploreServices />
      </HelmetProvider>,
    );

  it("renders correctly and sets SEO title", async () => {
    renderComponent();
    expect(screen.getByText(/Service Directory/i)).toBeInTheDocument();
  });

  it("renders only 6 categories initially", () => {
    renderComponent();
    const categoryHeadings = screen.getAllByRole("heading", { level: 2 });
    expect(categoryHeadings.length).toBe(6);
  });

  it("displays category details correctly", () => {
    renderComponent();
    expect(screen.getByText("Category 1")).toBeInTheDocument();
    expect(screen.getAllByText("5 sub-categories")[0]).toBeInTheDocument();
  });

  it("renders visible subcategories (max 4)", () => {
    renderComponent();
    expect(screen.getByText("Sub 0-1")).toBeInTheDocument();
    expect(screen.getByText("Sub 0-4")).toBeInTheDocument();
    expect(screen.queryByText("Sub 0-5")).not.toBeInTheDocument();
  });

  it("shows extra services count", () => {
    renderComponent();
    expect(screen.getAllByText(/\+1 more services/i)[0]).toBeInTheDocument();
  });

  it("navigates to a specific category when card is clicked", () => {
    renderComponent();
    const card = screen.getByText("Category 1").closest(".group");
    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith("/category/Category 1");
  });

  it("navigates to a sub-category and stops propagation", () => {
    renderComponent();
    const subButton = screen.getByText("Sub 0-1").closest("button");
    fireEvent.click(subButton);

    expect(mockNavigate).toHaveBeenCalledWith("/services/Category 1/Sub 0-1");
    expect(mockNavigate).not.toHaveBeenCalledWith("/category/Category 1");
  });

  it('shows "View All Services" link if more than 6 categories', () => {
    renderComponent();
    const viewAllLinks = screen.getAllByText(/View All Services/i);
    expect(viewAllLinks.length).toBeGreaterThan(0);
    fireEvent.click(viewAllLinks[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/explore/all");
  });

  it('shows bottom "Explore All" section', () => {
    renderComponent();
    const exploreAllBtn = screen.getByText(/Explore All 10 Services/i);
    fireEvent.click(exploreAllBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/explore/all");
  });
});
