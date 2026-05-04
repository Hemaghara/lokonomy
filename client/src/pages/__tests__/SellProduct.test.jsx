import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import SellProduct from "../SellProduct";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { marketService } from "../../services";
import { toast } from "react-hot-toast";

vi.mock("../../services", () => ({
  marketService: {
    addProduct: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

vi.mock("../../components/MapPicker", () => ({
  default: ({ value, onChange }) => (
    <div data-testid="map-picker">
      <button
        onClick={() =>
          onChange({
            lat: 23.0,
            lng: 72.5,
            address: "Ahmedabad, Gujarat",
            pincode: "380001",
          })
        }
      >
        Select Location
      </button>
    </div>
  ),
}));

vi.mock("../../context/LocationContext", () => ({
  LocationProvider: ({ children }) => (
    <div data-testid="location-provider">{children}</div>
  ),
  useLocation: () => ({ state: "Gujarat", availableDistricts: ["Ahmedabad"] }),
}));

vi.mock("../../context/UserContext", () => ({
  useUser: () => ({
    user: {
      id: "u1",
      name: "Test User",
      email: "test@example.com",
      subscription: { plan: "free" },
      usage: { productsUploaded: 1 },
    },
  }),
}));

vi.mock("../../hooks/usePlanLimits", () => ({
  usePlanLimits: () => ({
    limits: { productsUploaded: 10 },
  }),
}));

vi.mock("../../data/marketCategories", () => ({
  MARKET_CATEGORIES: {
    Electronics: ["Phones", "Laptops"],
    Furniture: ["Tables", "Chairs"],
  },
}));

const mockToast = Object.assign(vi.fn(), {
  success: vi.fn(),
  error: vi.fn(),
  dismiss: vi.fn(),
  custom: vi.fn(),
});
vi.mock("react-hot-toast", () => ({
  toast: mockToast,
  default: mockToast,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...p }) => {
      const f = { ...p };
      [
        "initial",
        "animate",
        "exit",
        "transition",
        "layout",
        "whileHover",
        "whileTap",
        "whileInView",
        "layoutId",
      ].forEach((k) => delete f[k]);
      return <div {...f}>{children}</div>;
    },
    span: ({ children, ...p }) => {
      const f = { ...p };
      [
        "initial",
        "animate",
        "exit",
        "transition",
        "layout",
        "whileHover",
        "whileTap",
      ].forEach((k) => delete f[k]);
      return <span {...f}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe("SellProduct Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it("renders the product listing form with initial user data", () => {
    render(<SellProduct />);
    expect(screen.getByText(/List Your Product/i)).toBeDefined();
    expect(
      screen.getByPlaceholderText(/e.g. Professional Camera Setup/i),
    ).toBeDefined();
    expect(screen.getByDisplayValue("test@example.com")).toBeDefined();
  });

  it("updates category and subcategory correctly", async () => {
    render(<SellProduct />);

    const categoryBtn = screen.getByText(/Select Category/i);
    fireEvent.click(categoryBtn);

    const electronicsOpt = screen.getByText("Electronics");
    fireEvent.click(electronicsOpt);

    expect(screen.getByText("Electronics")).toBeDefined();

    const subCategoryBtn = screen.getByText(/Select Sub-Category/i);
    fireEvent.click(subCategoryBtn);

    const phonesOpt = screen.getByText("Phones");
    fireEvent.click(phonesOpt);

    expect(screen.getByText("Phones")).toBeDefined();
  });

  it("disables subcategory if no category is selected", () => {
    render(<SellProduct />);
    const subCategoryBtn = screen.getByRole("button", {
      name: /Select Sub-Category/i,
    });
    expect(subCategoryBtn.disabled).toBe(true);
  });

  it("handles image upload and removal", async () => {
    render(<SellProduct />);
    const fileInput = screen.getByLabelText(/Add/i, { selector: "input" });

    const file = new File(["hello"], "hello.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("img")).toBeDefined();
    });

    const removeBtn = screen.getByRole("button", { name: "" }); // The X button in image preview
    fireEvent.click(removeBtn);

    expect(screen.queryByRole("img")).toBeNull();
  });

  it("shows error if submitting without images", async () => {
    render(<SellProduct />);
    fireEvent.change(
      screen.getByPlaceholderText(/e.g. Professional Camera Setup/i),
      { target: { value: "Test" } },
    );
    fireEvent.change(screen.getByPlaceholderText("0"), {
      target: { value: "100" },
    });

    const submitBtn = screen.getByRole("button", { name: /Publish Listing/i });
    fireEvent.click(submitBtn);

    expect(toast.error).toHaveBeenCalledWith("At least one photo is required.");
  });

  it("submits the form successfully", async () => {
    render(<SellProduct />);

    // Fill fields
    fireEvent.change(
      screen.getByPlaceholderText(/e.g. Professional Camera Setup/i),
      { target: { value: "Test iPhone" } },
    );
    fireEvent.change(screen.getByPlaceholderText("0"), {
      target: { value: "50000" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Describe the item/i), {
      target: { value: "Brand new condition" },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+91 Phone Number/i), {
      target: { value: "9876543210" },
    });

    // Mock Location selection
    fireEvent.click(screen.getByText("Select Location"));
    expect(screen.getByDisplayValue("380001")).toBeDefined();

    // Mock Image upload (needed for submission)
    fireEvent.change(screen.getByLabelText(/Add/i, { selector: "input" }), {
      target: { files: [file] },
    });

    await waitFor(() => expect(screen.getByRole("img")).toBeDefined());

    const submitBtn = screen.getByRole("button", { name: /Publish Listing/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(marketService.addProduct).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        "Product listed successfully!",
      );
    });
  });

  it("toggles auction settings", async () => {
    render(<SellProduct />);
    const auctionToggle = screen.getByText(/Enable Bidding/i);
    fireEvent.click(auctionToggle);

    expect(screen.getByText(/Starting Price/i)).toBeDefined();
    expect(screen.getByText(/Auction End Date/i)).toBeDefined();

    fireEvent.change(
      screen.getByPlaceholderText("0", {
        selector: 'input[name="startingPrice"]',
      }),
      { target: { value: "1000" } },
    );
    expect(screen.getByDisplayValue("1000")).toBeDefined();
  });

  it("shows platinum alert for featured listing when user is free", async () => {
    render(<SellProduct />);
    const featuredToggle = screen.getByText(/Featured Listing/i);
    fireEvent.click(featuredToggle);
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining(
        "Featured listings are exclusive to Platinum members",
      ),
    );
  });

  it("handles LIMIT_REACHED error with custom toast", async () => {
    const limitError = {
      response: {
        data: {
          code: "LIMIT_REACHED",
          message: "Plan limit reached",
        },
      },
    };
    marketService.addProduct.mockRejectedValueOnce(limitError);

    render(<SellProduct />);

    // Fill required fields to reach submission
    fireEvent.change(
      screen.getByPlaceholderText(/e.g. Professional Camera Setup/i),
      { target: { value: "Test" } },
    );
    fireEvent.change(screen.getByPlaceholderText("0"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Describe the item/i), {
      target: { value: "Desc" },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+91 Phone Number/i), {
      target: { value: "9876543210" },
    });

    fireEvent.change(screen.getByLabelText(/Add/i, { selector: "input" }), {
      target: { files: [file] },
    });

    await waitFor(() => expect(screen.getByRole("img")).toBeDefined());

    const submitBtn = screen.getByRole("button", { name: /Publish Listing/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // toast is called with a function for custom rendering
      expect(vi.mocked(toast)).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Object),
      );
    });
  });

  it("handles general API errors", async () => {
    marketService.addProduct.mockRejectedValueOnce(new Error("Network Error"));

    render(<SellProduct />);

    // Setup for submission
    fireEvent.change(
      screen.getByPlaceholderText(/e.g. Professional Camera Setup/i),
      { target: { value: "Test" } },
    );
    fireEvent.change(screen.getByPlaceholderText("0"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Describe the item/i), {
      target: { value: "Desc" },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+91 Phone Number/i), {
      target: { value: "9876543210" },
    });
    fireEvent.change(screen.getByLabelText(/Add/i, { selector: "input" }), {
      target: { files: [file] },
    });

    await waitFor(() => expect(screen.getByRole("img")).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: /Publish Listing/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error: Network Error");
    });
  });

  it("shows remaining plan limits", () => {
    render(<SellProduct />);
    expect(screen.getByText(/Remaining: 9 \/ 10/i)).toBeDefined();
  });
});
