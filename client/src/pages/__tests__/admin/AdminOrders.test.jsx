import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from "../../../utils/test-utils";
import AdminOrders from "../../admin/AdminOrders";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Mock react-hot-toast
vi.mock("react-hot-toast", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
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

// Mock AdminLayout
vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

// Mock adminService
vi.mock("../../../services", () => ({
  adminService: {
    getMarketOrders: vi.fn(),
    updateOrderStatus: vi.fn(),
  },
}));

const mockOrdersResponse = {
  data: {
    orders: [
      {
        _id: "o1",
        product: { productName: "Laptop", subCategory: "Electronics" },
        buyer: { name: "Alice" },
        seller: { name: "Store A" },
        price: 50000,
        orderStatus: "pending",
        createdAt: new Date("2023-01-01").toISOString(),
      },
      {
        _id: "o2",
        product: { productName: "Phone", subCategory: "Electronics" },
        buyer: { name: "Bob" },
        seller: { name: "Store B" },
        price: 30000,
        orderStatus: "shipped",
        createdAt: new Date("2023-01-02").toISOString(),
      },
    ],
    totalPages: 2,
    totalOrders: 2,
  },
};

describe("AdminOrders Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:url");
    global.URL.revokeObjectURL = vi.fn();

    // Default mock response
    adminService.getMarketOrders.mockResolvedValue(mockOrdersResponse);
    adminService.updateOrderStatus.mockResolvedValue({
      data: { success: true },
    });
  });

  it("renders loading state initially", async () => {
    adminService.getMarketOrders.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockOrdersResponse), 100),
        ),
    );
    render(<AdminOrders />);
    expect(screen.getByTestId("admin-layout")).toBeInTheDocument();
  });

  it("renders orders list correctly", async () => {
    render(<AdminOrders />);

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("Phone")).toBeInTheDocument();
      expect(screen.getByText(/Alice/i)).toBeInTheDocument();
      expect(screen.getByText(/Bob/i)).toBeInTheDocument();
    });
  });

  it("handles API failure during fetch", async () => {
    adminService.getMarketOrders.mockRejectedValueOnce(
      new Error("Network error"),
    );
    render(<AdminOrders />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch orders");
    });
  });

  it("handles search input on Enter", async () => {
    render(<AdminOrders />);

    await screen.findByText("Laptop");
    const searchInput = screen.getByPlaceholderText(/Search by order ID/i);

    fireEvent.change(searchInput, { target: { value: "Laptop" } });
    fireEvent.keyPress(searchInput, { key: "Enter", code: 13, charCode: 13 });

    await waitFor(() => {
      expect(adminService.getMarketOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Laptop",
        }),
      );
    });
  });

  it("toggles filters visibility", async () => {
    render(<AdminOrders />);

    const filtersBtn = screen.getByText(/Filters/i);
    fireEvent.click(filtersBtn);

    await screen.findByLabelText(/Status/i);
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();

    // Toggle off
    fireEvent.click(filtersBtn);
    await waitFor(() => {
      expect(screen.queryByLabelText(/Status/i)).not.toBeInTheDocument();
    });
  });

  it("handles status and date filter change", async () => {
    render(<AdminOrders />);

    const filtersBtn = screen.getByText(/Filters/i);
    fireEvent.click(filtersBtn);

    const statusSelect = await screen.findByLabelText(/Status/i);
    fireEvent.change(statusSelect, { target: { value: "processing" } });

    await waitFor(() => {
      expect(adminService.getMarketOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "processing",
        }),
      );
    });

    const startDateInput = screen.getByLabelText(/Start Date/i);
    fireEvent.change(startDateInput, { target: { value: "2023-01-01" } });

    await waitFor(() => {
      expect(adminService.getMarketOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: "2023-01-01",
        }),
      );
    });

    const endDateInput = screen.getByLabelText(/End Date/i);
    fireEvent.change(endDateInput, { target: { value: "2023-12-31" } });

    await waitFor(() => {
      expect(adminService.getMarketOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          endDate: "2023-12-31",
        }),
      );
    });
  });

  it("handles empty state", async () => {
    adminService.getMarketOrders.mockResolvedValueOnce({
      data: { orders: [], totalOrders: 0, totalPages: 1 },
    });
    render(<AdminOrders />);
    await waitFor(() => {
      expect(screen.getByText(/No orders found/i)).toBeInTheDocument();
    });
  });

  it("exports to CSV correctly", async () => {
    render(<AdminOrders />);
    await screen.findByText("Laptop");

    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
    };
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(mockLink);
    const appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation(() => {});

    const exportBtn = screen.getByText(/Export CSV/i);
    fireEvent.click(exportBtn);

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockLink.setAttribute).toHaveBeenCalledWith(
      "download",
      expect.stringContaining("orders_report_"),
    );
    expect(mockLink.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
  });

  it("navigates to order details on ID click", async () => {
    render(<AdminOrders />);
    await screen.findByText("Laptop");

    const orderIdLinks = screen.getAllByText(/#O1|#O2/i);
    fireEvent.click(orderIdLinks[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/marketplace/order/o1");
  });

  it("navigates to order details on Eye icon click", async () => {
    render(<AdminOrders />);
    await screen.findByText("Laptop");

    // Find the eye icon button inside the table row
    // It's the first button in the actions cell
    const viewBtns = document.querySelectorAll("button:has(svg)");
    // we need to find the specific one for navigating, filtering might be easier via traversing
    // Let's just click the first button that triggers navigation for order 1
    const tr = screen.getAllByRole("row")[1]; // first row body
    const eyeBtn = tr.querySelector("button");

    fireEvent.click(eyeBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/admin/marketplace/order/o1");
  });

  it("updates a single order status", async () => {
    render(<AdminOrders />);
    await screen.findByText("Laptop");

    // Click on the status update option for the first order
    const tr = screen.getAllByRole("row")[1];
    const statusBtns = tr.querySelectorAll("button.text-left"); // the dropdown options

    const deliveredBtn = Array.from(statusBtns).find(
      (btn) => btn.textContent === "delivered",
    );

    fireEvent.click(deliveredBtn);

    await waitFor(() => {
      expect(adminService.updateOrderStatus).toHaveBeenCalledWith(
        "o1",
        "delivered",
      );
      expect(toast.success).toHaveBeenCalledWith("Order status updated");
      // Fetch called again
      expect(adminService.getMarketOrders).toHaveBeenCalledTimes(2);
    });
  });

  it("handles error on single order status update", async () => {
    adminService.updateOrderStatus.mockRejectedValueOnce(
      new Error("Update failed"),
    );
    render(<AdminOrders />);
    await screen.findByText("Laptop");

    const tr = screen.getAllByRole("row")[1];
    const statusBtns = tr.querySelectorAll("button.text-left");
    const cancelledBtn = Array.from(statusBtns).find(
      (btn) => btn.textContent === "cancelled",
    );

    fireEvent.click(cancelledBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update status");
    });
  });

  it("handles single order selection", async () => {
    render(<AdminOrders />);
    await screen.findByText("Laptop");

    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is "select all", next two are order items
    fireEvent.click(checkboxes[1]);

    // Bulk action panel should appear
    expect(screen.getByText("Selected")).toBeInTheDocument();

    // Select again to deselect
    fireEvent.click(checkboxes[1]);
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  });

  it("handles select all orders", async () => {
    render(<AdminOrders />);
    await screen.findByText("Laptop");

    const selectAllCheckbox = screen.getByLabelText("Select all orders");
    fireEvent.click(selectAllCheckbox);

    // Bulk action panel should show 2 selected
    const selectedCount = screen.getByText("2", {
      selector: ".bg-indigo-600",
    });
    expect(selectedCount).toBeInTheDocument();
    expect(screen.getByText("Selected")).toBeInTheDocument();

    // Deselect all
    fireEvent.click(selectAllCheckbox);
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  });

  it("performs bulk status update", async () => {
    render(<AdminOrders />);
    await screen.findByText("Laptop");

    const selectAllCheckbox = screen.getByLabelText("Select all orders");
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(
        screen.getByText("2", { selector: ".bg-indigo-600" }),
      ).toBeInTheDocument();
    });

    // The bulk panel buttons are the only buttons in the fixed footer
    const bulkPanel = document.querySelector(".fixed.bottom-8");
    const bulkShippedBtn = within(bulkPanel).getByText("shipped");
    fireEvent.click(bulkShippedBtn);

    await waitFor(() => {
      expect(adminService.updateOrderStatus).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Updated"),
      );
    });
  });

  it("handles error on bulk status update", async () => {
    adminService.updateOrderStatus.mockRejectedValueOnce(
      new Error("Update failed"),
    );
    render(<AdminOrders />);
    await screen.findByText("Laptop");

    const selectAllCheckbox = screen.getByLabelText("Select all orders");
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(
        screen.getByText("2", { selector: ".bg-indigo-600" }),
      ).toBeInTheDocument();
    });

    const bulkPanel = document.querySelector(".fixed.bottom-8");
    const bulkProcessingBtn = within(bulkPanel).getByText("processing");
    fireEvent.click(bulkProcessingBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Bulk update failed");
    });
  });

  it("closes bulk update panel when close button is clicked", async () => {
    render(<AdminOrders />);
    await screen.findByText("Laptop");

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // Select one

    expect(screen.getByText("Selected")).toBeInTheDocument();

    // The close button is the one with FiXCircle, it's the last button in the panel
    const closeBtn = document.querySelector(
      ".fixed.bottom-8 button:last-child",
    );
    fireEvent.click(closeBtn);

    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  });
});
