import React from "react";
import { render, screen, fireEvent } from "../../utils/test-utils";
import AllServices from "../AllServices";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock categories data
vi.mock("../../data/categories", () => ({
  categories: [
    {
      id: 1,
      name: "Electronics",
      icon: "📱",
      subcategories: [
        { name: "Mobile Repair", icon: "🔧" },
        { name: "Laptop Repair", icon: "💻" },
        { name: "AC Repair", icon: "❄️" },
        { name: "TV Repair", icon: "📺" },
        { name: "CCTV", icon: "📹" },
      ],
    },
    {
      id: 2,
      name: "Cleaning",
      icon: "🧹",
      subcategories: [
        { name: "Home Cleaning", icon: "🏠" },
        { name: "Car Wash", icon: "🚗" },
      ],
    },
  ],
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  };
});

describe("AllServices Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all categories and basic info", () => {
    render(<AllServices />);

    expect(screen.getByText(/All Services/i)).toBeInTheDocument();
    expect(screen.getByText(/2 categories available/i)).toBeInTheDocument();
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Cleaning")).toBeInTheDocument();
  });

  it("filters categories based on category name search", () => {
    render(<AllServices />);

    const searchInput = screen.getByPlaceholderText(/Search services/i);
    fireEvent.change(searchInput, { target: { value: "Elect" } });

    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.queryByText("Cleaning")).not.toBeInTheDocument();
  });

  it("filters categories based on subcategory name search", () => {
    render(<AllServices />);

    const searchInput = screen.getByPlaceholderText(/Search services/i);
    fireEvent.change(searchInput, { target: { value: "Car" } });

    expect(screen.getByText("Cleaning")).toBeInTheDocument();
    expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
  });

  it("shows empty state when no results match search", () => {
    render(<AllServices />);

    const searchInput = screen.getByPlaceholderText(/Search services/i);
    fireEvent.change(searchInput, { target: { value: "NonExistent" } });

    expect(
      screen.getByText(/No services found for "NonExistent"/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Clear Search/i }),
    ).toBeInTheDocument();
  });

  it('clears search input via the "X" button', () => {
    render(<AllServices />);

    const searchInput = screen.getByPlaceholderText(/Search services/i);
    fireEvent.change(searchInput, { target: { value: "Cleaning" } });

    const clearBtn = screen.getByRole("button", { name: "" }); // The HiOutlineXMark button
    fireEvent.click(clearBtn);

    expect(searchInput.value).toBe("");
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it('clears search input via the "Clear Search" button in empty state', () => {
    render(<AllServices />);

    const searchInput = screen.getByPlaceholderText(/Search services/i);
    fireEvent.change(searchInput, { target: { value: "NonExistent" } });

    fireEvent.click(screen.getByRole("button", { name: /Clear Search/i }));

    expect(searchInput.value).toBe("");
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("navigates to category page when category card is clicked", () => {
    render(<AllServices />);

    fireEvent.click(screen.getByText("Electronics"));
    expect(mockNavigate).toHaveBeenCalledWith("/category/Electronics");
  });

  it("navigates to specific service page when subcategory is clicked", () => {
    render(<AllServices />);

    // Subcategories are inside buttons
    const subCatBtn = screen.getByText("Mobile Repair").closest("button");
    fireEvent.click(subCatBtn);

    expect(mockNavigate).toHaveBeenCalledWith(
      "/services/Electronics/Mobile Repair",
    );
  });

  it('shows "+X more services" label when more than 4 subcategories exist', () => {
    render(<AllServices />);

    // Electronics has 5 subcategories, so should show "+1 more"
    expect(screen.getByText(/\+1 more services/i)).toBeInTheDocument();
    // Cleaning has 2, so should NOT show it
    const cleaningCard = screen
      .getByText("Cleaning")
      .closest("div").parentElement;
    expect(cleaningCard).not.toHaveTextContent(/more services/i);
  });

  it("has a back link to explore directory", () => {
    render(<AllServices />);
    const backLink = screen.getByText(/Back to Service Directory/i);
    expect(backLink.getAttribute("href")).toBe("/explore");
  });

  it("shows search result count message", () => {
    render(<AllServices />);

    const searchInput = screen.getByPlaceholderText(/Search services/i);
    fireEvent.change(searchInput, { target: { value: "Cleaning" } });

    expect(
      screen.getByText(/1 category found for "Cleaning"/i),
    ).toBeInTheDocument();
  });
});
