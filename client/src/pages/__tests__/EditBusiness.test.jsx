import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import EditBusiness from "../EditBusiness";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { businessService, generateBusinessDescription } from "../../services";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "b1" }),
    useNavigate: () => mockNavigate,
  };
});

// Mock LocationContext
vi.mock("../../context/LocationContext", () => ({
  LocationProvider: ({ children }) => <>{children}</>,
  useLocation: () => ({ district: "Ahmedabad", taluka: "City" }),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => {
  const toastMock = {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  };
  return {
    default: toastMock,
    toast: toastMock,
    Toaster: () => null,
  };
});

import { toast } from "react-hot-toast";

// Mock services
vi.mock("../../services", () => ({
  businessService: {
    getBusinessById: vi.fn(),
    updateBusiness: vi.fn(),
  },
  generateBusinessDescription: vi.fn(),
}));

// Mock MapPicker
vi.mock("../../components/MapPicker", () => ({
  default: ({ value, onChange }) => (
    <div data-testid="map-picker">
      <button
        type="button"
        onClick={() =>
          onChange({
            lat: 23.0,
            lng: 72.5,
            address: "Updated Address",
            pincode: "380001",
            state: "Gujarat",
            district: "Ahmedabad",
            taluka: "City",
          })
        }
      >
        Move Marker
      </button>
      {value ? (
        <span data-testid="location-pinned">Pinned</span>
      ) : (
        <span data-testid="location-not-pinned">Not Pinned</span>
      )}
    </div>
  ),
}));

const mockBusinessData = {
  data: {
    _id: "b1",
    businessName: "Original Name",
    ownerName: "Owner",
    description: "Old Description",
    mainCategory: "Electronics",
    subCategory: "Smartphones",
    contactNumber: "1234567890",
    email: "test@biz.com",
    website: "https://biz.com",
    address: "Old Address",
    state: "Gujarat",
    district: "Ahmedabad",
    taluka: "City",
    pincode: "380001",
    logo: "logo.jpg",
    photos: ["p1.jpg"],
    location: { coordinates: [72.5, 23.0] },
    businessHours: {
      Monday: { isOpen: true, startTime: "09:00", endTime: "18:00" },
    },
  },
};

describe("EditBusiness Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    businessService.getBusinessById.mockResolvedValue(mockBusinessData);
    businessService.updateBusiness.mockResolvedValue({
      data: { success: true, business: { _id: "b1" } },
    });
    generateBusinessDescription.mockResolvedValue("AI Generated Description");
  });

  const getFieldInput = (labelRegex) => {
    const labels = screen.getAllByText(labelRegex).filter(el => el.tagName === 'LABEL');
    const label = labels[0];
    return label.closest('div').querySelector('input') || 
           label.closest('div').querySelector('select') ||
           label.closest('div').querySelector('textarea');
  };

// Mock categories data
vi.mock("../../data/categories", () => ({
  categories: [
    {
      name: 'Electronics',
      subcategories: [{ name: 'Smartphones' }]
    },
    {
      name: 'Food & Drinks',
      subcategories: [{ name: 'Restaurants' }]
    }
  ]
}));

  it("shows loading spinner initially", () => {
    businessService.getBusinessById.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<EditBusiness />);
    expect(screen.getByText(/Loading Business/i)).toBeInTheDocument();
  });

  it("fetches and displays business data on load", async () => {
    render(<EditBusiness />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Original Name")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Owner")).toBeInTheDocument();
      expect(screen.getByDisplayValue("test@biz.com")).toBeInTheDocument();
    });
  });

  it("handles API error on load", async () => {
    businessService.getBusinessById.mockRejectedValue(new Error("Fetch failed"));
    render(<EditBusiness />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load business data");
      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });
  });

  it("generates description using AI", async () => {
    render(<EditBusiness />);
    await waitFor(() => screen.getByDisplayValue("Original Name"));

    const aiBtn = screen.getByRole("button", { name: /Generate with AI/i });
    fireEvent.click(aiBtn);

    await waitFor(() => {
      expect(generateBusinessDescription).toHaveBeenCalledWith(
        "Original Name",
        "Electronics",
        "Smartphones",
        "Old Address",
      );
      expect(
        screen.getByPlaceholderText(/Tell customers about your services/i).value,
      ).toBe("AI Generated Description");
      expect(toast.success).toHaveBeenCalledWith(
        "Description generated! Feel free to edit it.",
      );
    });
  });

  it("shows error if AI generation is clicked without name or category", async () => {
    businessService.getBusinessById.mockResolvedValue({
      data: { ...mockBusinessData.data, businessName: "", mainCategory: "" },
    });
    render(<EditBusiness />);
    await waitFor(() => screen.getAllByText(/Business Name/i)[0]);

    const aiBtn = screen.getByRole("button", { name: /Generate with AI/i });
    fireEvent.click(aiBtn);

    expect(toast.error).toHaveBeenCalledWith(
      "Please fill in Business Name and Category first",
    );
  });

  it("handles subcategory filtering based on main category", async () => {
    render(<EditBusiness />);
    await waitFor(() => screen.getByDisplayValue("Original Name"));

    const mainCatSelect = getFieldInput(/Main Category/i);
    fireEvent.change(mainCatSelect, { target: { value: "Food & Drinks" } });

    const subCatSelect = getFieldInput(/Sub Category/i);
    expect(subCatSelect).not.toBeDisabled();
  });

  it("validates contact number (10 digits)", async () => {
    render(<EditBusiness />);
    await waitFor(() => screen.getByDisplayValue("Original Name"));

    const contactInput = getFieldInput(/Contact Number/i);
    fireEvent.change(contactInput, { target: { value: "123" } });

    const submitBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.submit(submitBtn.closest("form"));

    expect(toast.error).toHaveBeenCalledWith(
      "Please enter a valid 10-digit contact number.",
    );
  });

  it("handles map location updates", async () => {
    render(<EditBusiness />);
    await waitFor(() => screen.getByDisplayValue("Original Name"));

    const moveMarkerBtn = screen.getByText("Move Marker");
    fireEvent.click(moveMarkerBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Updated Address")).toBeInTheDocument();
    });
  });

  it("updates business details successfully", async () => {
    render(<EditBusiness />);
    await waitFor(() => screen.getByDisplayValue("Original Name"));

    fireEvent.change(getFieldInput(/Business Name/i), {
      target: { value: "New Name" },
    });

    const submitBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.submit(submitBtn.closest("form"));

    await waitFor(() => {
      expect(businessService.updateBusiness).toHaveBeenCalledWith(
        "b1",
        expect.objectContaining({
          businessName: "New Name",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Business Updated Successfully!",
      );
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it("handles photo removal", async () => {
    render(<EditBusiness />);
    await waitFor(() => screen.getByDisplayValue("Original Name"));

    // Find the button inside the gallery container
    const galleryImg = screen.getByAltText(/Gallery 0/i);
    const removeBtn = galleryImg.closest('div').querySelector('button');
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByAltText(/Gallery 0/i)).not.toBeInTheDocument();
    });
  });

  it("handles file upload size limit", async () => {
    render(<EditBusiness />);
    await waitFor(() => screen.getByDisplayValue("Original Name"));

    // The "Add" label contains the input
    const addLabel = screen.getByText("Add").closest("label");
    const fileInput = addLabel.querySelector("input");
    const largeFile = new File([""], "large.jpg", { type: "image/jpeg" });
    Object.defineProperty(largeFile, "size", { value: 3 * 1024 * 1024 }); // 3MB

    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    expect(toast.error).toHaveBeenCalledWith(
      "File is too large. Please select an image under 2MB.",
    );
  });

  it("handles time picker interaction", async () => {
    render(<EditBusiness />);
    await waitFor(() => screen.getByDisplayValue("Original Name"));

    // Find the Opening Time button for Monday
    const timePickerBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent.includes("09:00 AM"));
    fireEvent.click(timePickerBtn);

    // Should open the time picker
    expect(screen.getByText("Opening Time")).toBeInTheDocument();

    const hourBtn = screen.getAllByRole("button", { name: "10" })[0];
    fireEvent.click(hourBtn);

    const doneBtn = screen.getByRole("button", { name: "Done" });
    fireEvent.click(doneBtn);

    expect(screen.queryByText("Opening Time")).not.toBeInTheDocument();
  });

  it("applies hours to all days", async () => {
    render(<EditBusiness />);
    await waitFor(() => screen.getByDisplayValue("Original Name"));

    const applyAllBtn = screen.getAllByTitle(/Apply to all days/i)[0];
    fireEvent.click(applyAllBtn);

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Applied Monday's hours to all days"),
    );
  });

  it("handles back button", async () => {
    render(<EditBusiness />);
    await waitFor(() => screen.getByDisplayValue("Original Name"));

    const backBtn = screen.getByRole("button", { name: /Back/i });
    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
