import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminBusinessDetails from "../../admin/AdminBusinessDetails";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "b1" }),
    useNavigate: () => vi.fn(),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  };
});
import { adminService } from "../../../services";

// Mock adminService
vi.mock("../../../services", () => ({
  adminService: {
    getBusinessDetails: vi.fn(),
    getBusinessScore: vi.fn(),
    deleteContent: vi.fn(),
  },
}));

const mockBusinessData = {
  data: {
    _id: "b1",
    businessName: "Gourmet Bakery",
    mainCategory: "Food",
    subCategory: "Bakery",
    status: "active",
    email: "bakery@example.com",
    phone: "1234567890",
    website: "https://bakery.com",
    description: "The best bakery in town",
    district: "Mumbai",
    taluka: "Andheri",
    location: { coordinates: [19.1, 72.8] },
    logo: "logo.png",
    visits: 500,
    rating: 4.8,
    reviews: [{}, {}],
    products: [
      {
        _id: "p1",
        productName: "Croissant",
        price: 50,
        productImages: ["c.png"],
        mainCategory: "Bread",
      },
    ],
    photos: ["p1.png", "p2.png"],
    ownerId: {
      _id: "u1",
      name: "Baker Joe",
      email: "joe@example.com",
      profilePic: "joe.png",
    },
    createdAt: new Date().toISOString(),
  },
};

const mockScoreData = {
  data: {
    score: 85,
    signals: [
      { label: "Active Subscription", type: "positive", points: 20 },
      { label: "Low Response Rate", type: "negative", points: -5 },
      { label: "Neutral signal", type: "neutral", points: 0 },
    ],
  },
};

describe("AdminBusinessDetails Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockImplementation(() => true);
    adminService.getBusinessDetails.mockResolvedValue(mockBusinessData);
    adminService.getBusinessScore.mockResolvedValue(mockScoreData);
    adminService.deleteContent.mockResolvedValue({ data: { success: true } });
  });

  it("renders loading state initially", async () => {
    let resolvePromise;
    adminService.getBusinessDetails.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    render(<AdminBusinessDetails />);

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();

    resolvePromise(mockBusinessData);
    await waitFor(() =>
      expect(screen.getAllByText("Gourmet Bakery")[0]).toBeInTheDocument(),
    );
  });

  it("renders business header and main details", async () => {
    render(<AdminBusinessDetails />);
    await waitFor(() =>
      expect(screen.getAllByText(/Gourmet Bakery/i)[0]).toBeDefined(),
    );
    expect(screen.getAllByText(/Food/i)[0]).toBeDefined();
    expect(screen.getAllByText(/active/i)[0]).toBeDefined();
    expect(screen.getAllByText(/bakery@example.com/i)[0]).toBeDefined();
  });

  it("renders owner information and navigation link", async () => {
    render(<AdminBusinessDetails />);

    await waitFor(() => {
      expect(screen.getAllByText("Baker Joe")[0]).toBeDefined();
      expect(screen.getAllByText("joe@example.com")[0]).toBeDefined();
      const ownerLink = screen.getByRole("link", { name: /Baker Joe/i });
      expect(ownerLink.getAttribute("href")).toBe("/admin/user/u1");
    });
  });

  it("renders health scorecard and signals", async () => {
    render(<AdminBusinessDetails />);

    await waitFor(() => {
      expect(screen.getAllByText("85")[0]).toBeDefined();
      expect(screen.getAllByText("Active Subscription")[0]).toBeDefined();
      expect(screen.getAllByText("+20")[0]).toBeDefined();
      expect(screen.getAllByText("-5")[0]).toBeDefined();
    });
  });

  it("handles tab switching (Gallery, Products)", async () => {
    render(<AdminBusinessDetails />);

    await waitFor(() => screen.getAllByText("Gourmet Bakery")[0]);

    // Gallery Tab
    const galleryTab = screen.getAllByRole("button").find(b => b.textContent.toLowerCase() === 'gallery');
    fireEvent.click(galleryTab);
    await waitFor(() => {
      expect(screen.getAllByText(/Media #1/i)[0]).toBeDefined();
    });

    // Products Tab
    const productsTab = screen.getAllByRole("button").find(b => b.textContent.toLowerCase() === 'products');
    fireEvent.click(productsTab);
    await waitFor(() => {
      expect(screen.getAllByText("Croissant")[0]).toBeDefined();
      expect(screen.getAllByText("₹50")[0]).toBeDefined();
    });
  });

  it("handles business deletion successfully", async () => {
    render(<AdminBusinessDetails />);

    await waitFor(() => screen.getAllByText("Gourmet Bakery")[0]);

    const deleteBtn = screen.getAllByRole("button", {
      name: /Delete business/i,
    })[0];
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(adminService.deleteContent).toHaveBeenCalledWith("business", "b1");
    });
  });

  it("cancels business deletion", async () => {
    vi.spyOn(window, "confirm").mockImplementation(() => false);
    render(<AdminBusinessDetails />);

    await waitFor(() => screen.getAllByText("Gourmet Bakery")[0]);

    const deleteBtn = screen.getAllByRole("button", {
      name: /Delete business/i,
    })[0];
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(adminService.deleteContent).not.toHaveBeenCalled();
  });

  it("handles API error when fetching business details", async () => {
    adminService.getBusinessDetails.mockRejectedValue(
      new Error("Failed to fetch"),
    );
    render(<AdminBusinessDetails />);

    await waitFor(() => {
      expect(adminService.getBusinessDetails).toHaveBeenCalled();
      expect(screen.queryByText("Gourmet Bakery")).not.toBeInTheDocument();
    });
  });

  it("handles API error when fetching health score", async () => {
    adminService.getBusinessScore.mockRejectedValue(
      new Error("Failed to fetch score"),
    );
    render(<AdminBusinessDetails />);

    await waitFor(() => {
      expect(screen.getAllByText("Gourmet Bakery")[0]).toBeDefined();
      expect(screen.queryByText("Health Scorecard")).not.toBeInTheDocument();
    });
  });

  it("renders fallback logo when no logo is provided", async () => {
    adminService.getBusinessDetails.mockResolvedValue({
      data: { ...mockBusinessData.data, logo: null },
    });
    render(<AdminBusinessDetails />);

    await waitFor(() => {
      expect(screen.getAllByText("Gourmet Bakery")[0]).toBeDefined();
      expect(screen.getByText("G")).toBeInTheDocument();
    });
  });

  it("renders without owner information", async () => {
    adminService.getBusinessDetails.mockResolvedValue({
      data: { ...mockBusinessData.data, ownerId: null },
    });
    render(<AdminBusinessDetails />);

    await waitFor(() => {
      expect(
        screen.getByText("Owner information unavailable"),
      ).toBeInTheDocument();
    });
  });

  it("renders empty gallery and products state", async () => {
    adminService.getBusinessDetails.mockResolvedValue({
      data: { ...mockBusinessData.data, photos: [], products: [] },
    });
    render(<AdminBusinessDetails />);

    await waitFor(() => screen.getAllByText("Gourmet Bakery")[0]);

    const galleryTab = screen.getAllByRole("button").find(b => b.textContent.toLowerCase() === 'gallery');
    fireEvent.click(galleryTab);
    await waitFor(() => {
      expect(
        screen.getByText("No gallery images uploaded"),
      ).toBeInTheDocument();
    });

    const productsTab = screen.getAllByRole("button").find(b => b.textContent.toLowerCase() === 'products');
    fireEvent.click(productsTab);
    await waitFor(() => {
      expect(
        screen.getByText("No products listed by this business"),
      ).toBeInTheDocument();
    });
  });

  it("handles missing description and coordinates", async () => {
    adminService.getBusinessDetails.mockResolvedValue({
      data: { ...mockBusinessData.data, description: null, location: null },
    });
    render(<AdminBusinessDetails />);

    await waitFor(() => {
      expect(
        screen.getByText("No description provided for this business."),
      ).toBeInTheDocument();
      expect(screen.getByText("Not set")).toBeInTheDocument();
    });
  });

  it("navigates back when back button is clicked", async () => {
    render(<AdminBusinessDetails />);
    await waitFor(() => screen.getAllByText("Gourmet Bakery")[0]);

    const backBtn = screen.getByLabelText("Go back");
    fireEvent.click(backBtn);
  });
});
