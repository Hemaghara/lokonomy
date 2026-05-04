import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import AddBusiness from "../AddBusiness";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { businessService, generateBusinessDescription } from "../../services";
import { useUser } from "../../context/UserContext";
import { toast } from "react-hot-toast";

// Mock services
vi.mock("../../services", () => ({
  businessService: {
    addBusiness: vi.fn(),
  },
  generateBusinessDescription: vi.fn(),
}));

// Mock UserContext
vi.mock("../../context/UserContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: vi.fn(),
  };
});

// Mock MapPicker
vi.mock("../../components/MapPicker", () => ({
  default: ({ value, onChange }) => (
    <div data-testid="mock-map">
      <button
        type="button"
        onClick={() =>
          onChange({
            lat: 23.0225,
            lng: 72.5714,
            address: "Test Street, Ahmedabad",
            pincode: "380001",
            state: "Gujarat",
            district: "Ahmedabad",
            taluka: "City",
          })
        }
      >
        Simulate Map Click
      </button>
      {value && <span>Location Selected</span>}
    </div>
  ),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      loading: vi.fn(),
      dismiss: vi.fn(),
    },
  };
});

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Add Business Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUser.mockReturnValue({ user: { name: "Test Owner" } });
  });

  it("renders the registration form with initial data", () => {
    render(<AddBusiness />);

    expect(screen.getByText(/Register Your Business/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Owner")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/e.g. Neo Electronics/i),
    ).toBeInTheDocument();
  });

  it("populates address fields when map location is selected", async () => {
    render(<AddBusiness />);

    fireEvent.click(screen.getByText("Simulate Map Click"));

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Test Street, Ahmedabad"),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("380001")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Ahmedabad")).toBeInTheDocument();
    });
  });

  it("handles business name and category changes", () => {
    render(<AddBusiness />);

    const nameInput = screen.getByPlaceholderText(/e.g. Neo Electronics/i);
    fireEvent.change(nameInput, {
      target: { name: "businessName", value: "My Shop" },
    });
    expect(nameInput.value).toBe("My Shop");

    const categorySelect = screen.getByLabelText(/Main Category/i);
    fireEvent.change(categorySelect, { target: { value: "Electronics" } });
    expect(categorySelect.value).toBe("Electronics");
  });

  it("generates description with AI", async () => {
    generateBusinessDescription.mockResolvedValue(
      "AI generated text for My Shop",
    );

    render(<AddBusiness />);

    // Set required fields for AI generation
    fireEvent.change(screen.getByPlaceholderText(/e.g. Neo Electronics/i), {
      target: { name: "businessName", value: "My Shop" },
    });
    fireEvent.change(screen.getByLabelText(/Main Category/i), {
      target: { value: "Electronics" },
    });

    fireEvent.click(screen.getByText(/Generate with AI/i));

    await waitFor(() => {
      expect(generateBusinessDescription).toHaveBeenCalled();
      expect(
        screen.getByPlaceholderText(/Tell customers about your services/i)
          .value,
      ).toBe("AI generated text for My Shop");
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Description generated"),
      );
    });
  });

  it("shows error if AI generation is triggered without business name", () => {
    render(<AddBusiness />);
    fireEvent.click(screen.getByText(/Generate with AI/i));
    expect(toast.error).toHaveBeenCalledWith(
      "Please fill in Business Name and Category first",
    );
  });

  it("handles logo upload", async () => {
    render(<AddBusiness />);

    const file = new File(["hello"], "logo.png", { type: "image/png" });
    const input = document.querySelector('input[name="logo"]');

    // Mock FileReader
    const mockReader = {
      readAsDataURL: vi.fn(function () {
        this.onloadend();
      }),
      result: "data:image/png;base64,mock",
      onloadend: null,
    };
    vi.spyOn(window, "FileReader").mockImplementation(function () { return mockReader; });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const img = screen.getByAltText("Logo");
      expect(img.src).toBe("data:image/png;base64,mock");
    });
  });

  it("handles gallery photo upload and removal", async () => {
    render(<AddBusiness />);

    const file = new File(["hello"], "photo.png", { type: "image/png" });
    const input = screen.getByText("Add").parentElement.querySelector("input");

    const mockReader = {
      readAsDataURL: vi.fn(function () {
        this.onloadend();
      }),
      result: "data:image/png;base64,gallery-mock",
      onloadend: null,
    };
    vi.spyOn(window, "FileReader").mockImplementation(function () { return mockReader; });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAltText("Gallery 0")).toBeInTheDocument();
    });

    // Remove photo
    const removeBtn = screen.getByRole("button", { name: "" }); // The X button on image
    fireEvent.click(removeBtn);
    expect(screen.queryByAltText("Gallery 0")).not.toBeInTheDocument();
  });

  it("handles business hours toggling", () => {
    render(<AddBusiness />);

    // Monday is open by default
    const mondayToggle = document.getElementById("isOpen-Monday");
    expect(mondayToggle.checked).toBe(true);

    // Toggle off
    fireEvent.click(mondayToggle);
    expect(mondayToggle.checked).toBe(false);
    expect(screen.getAllByText("Closed").length).toBe(2);
  });

  it("submits form successfully", async () => {
    businessService.addBusiness.mockResolvedValue({
      data: { success: true, business: { _id: "new_biz_id" } },
    });

    render(<AddBusiness />);

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/e.g. Neo Electronics/i), {
      target: { name: "businessName", value: "Success Shop" },
    });
    fireEvent.change(screen.getByLabelText(/Main Category/i), {
      target: { value: "Electronics" },
    });

    // Wait for sub-category and select it
    await waitFor(() => {
      const subCat = screen.getByLabelText(/Sub Category/i);
      fireEvent.change(subCat, { target: { value: "Mobile" } });
    });

    fireEvent.change(screen.getByPlaceholderText("82009 73720"), {
      target: { name: "contactNumber", value: "9876543210" },
    });

    // Map location
    fireEvent.click(screen.getByText("Simulate Map Click"));

    // Submit
    fireEvent.submit(screen.getByRole("button", { name: /Register Business/i }).closest("form"));

    await waitFor(() => {
      expect(businessService.addBusiness).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        "Business Registered Successfully!",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/business/new_biz_id");
    });
  });

  it("validates contact number format on submit", async () => {
    render(<AddBusiness />);

    fireEvent.change(screen.getByPlaceholderText("82009 73720"), {
      target: { name: "contactNumber", value: "123" },
    });
    fireEvent.click(screen.getByText("Simulate Map Click"));

    fireEvent.submit(screen.getByRole("button", { name: /Register Business/i }).closest("form"));

    expect(toast.error).toHaveBeenCalledWith(
      "Please enter a valid 10-digit contact number.",
    );
  });

  it("shows error if map location is missing on submit", async () => {
    render(<AddBusiness />);

    fireEvent.change(screen.getByPlaceholderText("82009 73720"), {
      target: { name: "contactNumber", value: "9876543210" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /Register Business/i }).closest("form"));

    expect(toast.error).toHaveBeenCalledWith(
      "Please pin your shop location on the map.",
    );
  });

  it("handles registration API error", async () => {
    businessService.addBusiness.mockRejectedValue({
      response: { data: { message: "Business name already taken" } },
    });

    render(<AddBusiness />);

    fireEvent.change(screen.getByPlaceholderText(/e.g. Neo Electronics/i), {
      target: { name: "businessName", value: "Taken Shop" },
    });
    fireEvent.change(screen.getByLabelText(/Main Category/i), {
      target: { value: "Electronics" },
    });
    fireEvent.change(screen.getByPlaceholderText("82009 73720"), {
      target: { name: "contactNumber", value: "9876543210" },
    });
    fireEvent.click(screen.getByText("Simulate Map Click"));

    fireEvent.submit(screen.getByRole("button", { name: /Register Business/i }).closest("form"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Business name already taken");
    });
  });
});
