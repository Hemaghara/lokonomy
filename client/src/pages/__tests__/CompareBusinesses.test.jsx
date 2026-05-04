import React from "react";
import { render, screen, waitFor, fireEvent } from "../../utils/test-utils";
import CompareBusinesses from "../CompareBusinesses";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { businessService } from "../../services";

const { mockNavigate, mockUseSearchParams } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseSearchParams: vi.fn(() => [new URLSearchParams()]),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useSearchParams: mockUseSearchParams,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  };
});

// Mock businessService
vi.mock("../../services", () => ({
  businessService: {
    getBusinessById: vi.fn().mockImplementation((id) =>
      Promise.resolve({
        data: {
          _id: id,
          businessName: `Business ${id}`,
          subCategory: "Retail",
          rating: 4.5,
          locationAddress: "Market Street",
          openingHours: "9 AM - 6 PM",
          phone: "1234567890",
          isVerified: true,
          description: "Quality local business.",
          logo: id === "b1" ? "logo.jpg" : null,
        },
      }),
    ),
  },
}));

describe("CompareBusinesses Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);
  });

  it("renders empty state when no IDs are provided", () => {
    render(<CompareBusinesses />);

    expect(screen.getByText(/No businesses selected/i)).toBeDefined();

    const backBtn = screen.getByRole("button", { name: /Go Back/i });
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalled();
  });

  it("renders comparison cards for provided IDs", async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams("ids=b1,b2")]);
    render(<CompareBusinesses />);

    await waitFor(() => {
      expect(screen.getAllByText("Business b1")[0]).toBeDefined();
      expect(screen.getAllByText("Business b2")[0]).toBeDefined();
    });

    expect(screen.getAllByText("Retail").length).toBe(2);
    expect(screen.getAllByText("9 AM - 6 PM").length).toBe(2);
    expect(screen.getAllByText(/Verified/i).length).toBe(4);
  });

  it("renders logo when available and emoji when not", async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams("ids=b1,b2")]);
    render(<CompareBusinesses />);

    await waitFor(() => {
      const images = screen.getAllByRole("img");
      expect(images.some((img) => img.getAttribute("src") === "logo.jpg")).toBe(
        true,
      );
      expect(screen.getByText("🏢")).toBeDefined();
    });
  });

  it("navigates to business profile", async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams("ids=b1")]);
    render(<CompareBusinesses />);

    await waitFor(() => screen.getAllByText("Business b1")[0]);

    const link = screen.getByText(/View Profile/i);
    expect(link.getAttribute("href")).toBe("/business/b1");
  });

  it("handles API error gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockUseSearchParams.mockReturnValue([new URLSearchParams("ids=error-id")]);
    businessService.getBusinessById.mockRejectedValueOnce(
      new Error("Fetch failed"),
    );

    render(<CompareBusinesses />);

    await waitFor(() => {
      expect(screen.getByText(/No businesses selected/i)).toBeDefined();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('renders "Not listed" for missing fields', async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams("ids=b3")]);
    businessService.getBusinessById.mockResolvedValueOnce({
      data: {
        _id: "b3",
        businessName: "Incomplete Biz",
      },
    });

    render(<CompareBusinesses />);

    await waitFor(() => {
      expect(screen.getByText("Incomplete Biz")).toBeDefined();
      expect(screen.getAllByText(/Not listed/i).length).toBeGreaterThan(0);
    });
  });

  it('handles "Add more businesses" link', async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams("ids=b1")]);
    render(<CompareBusinesses />);

    await waitFor(() => screen.getByText(/Add more businesses/i));
    expect(screen.getByText(/Add more businesses/i).getAttribute("href")).toBe(
      "/explore",
    );
  });
});
