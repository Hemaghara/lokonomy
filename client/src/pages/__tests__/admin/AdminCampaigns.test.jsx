import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminCampaigns from "../../admin/AdminCampaigns";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";

// Mock adminService
vi.mock("../../../services", () => ({
  adminService: {
    getCampaigns: vi.fn(),
    previewSegment: vi.fn(),
    createCampaign: vi.fn(),
    sendCampaign: vi.fn(),
    deleteCampaign: vi.fn(),
  },
}));

const mockCampaigns = [
  {
    _id: "camp1",
    name: "Renewal Drive",
    status: "draft",
    notification: { title: "Renew Now!", body: "Please renew" },
    stats: { targetedCount: 100, sentCount: 0, openedCount: 0 },
  },
  {
    _id: "camp2",
    name: "Welcome Series",
    status: "completed",
    notification: { title: "Welcome!", body: "Hello" },
    stats: { targetedCount: 50, sentCount: 50, openedCount: 40 },
  },
];

describe("AdminCampaigns Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getCampaigns.mockResolvedValue({ data: mockCampaigns });
    adminService.previewSegment.mockResolvedValue({
      data: {
        count: 50,
        sample: [{ _id: "u1", name: "John Doe", email: "john@test.com" }],
      },
    });
    adminService.createCampaign.mockResolvedValue({ data: { success: true } });
    adminService.sendCampaign.mockResolvedValue({
      data: { message: "Campaign sent!" },
    });
    adminService.deleteCampaign.mockResolvedValue({ data: { success: true } });
  });

  it("renders loading state initially", async () => {
    let resolvePromise;
    adminService.getCampaigns.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { container } = render(<AdminCampaigns />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();

    resolvePromise({ data: mockCampaigns });
    await waitFor(() =>
      expect(screen.getAllByText("Renewal Drive")[0]).toBeDefined(),
    );
  });

  it("renders campaigns list", async () => {
    render(<AdminCampaigns />);

    await waitFor(() => {
      expect(screen.getAllByText("Renewal Drive")[0]).toBeDefined();
      expect(screen.getAllByText("draft")[0]).toBeDefined();
      expect(screen.getByText(/Renew Now!/i)).toBeDefined();
      expect(screen.getAllByText("Welcome Series")[0]).toBeDefined();
      expect(screen.getAllByText("completed")[0]).toBeDefined();
    });
  });

  it("handles empty state", async () => {
    adminService.getCampaigns.mockResolvedValue({ data: [] });
    render(<AdminCampaigns />);

    await waitFor(() => {
      expect(screen.getByText("No Campaigns Yet")).toBeInTheDocument();
    });
  });

  it("opens creation modal and handles segment preview", async () => {
    render(<AdminCampaigns />);

    const newBtn = screen.getAllByRole("button", { name: /New Campaign/i })[0];
    fireEvent.click(newBtn);

    expect(screen.getAllByText("Create Campaign")[0]).toBeDefined();

    const previewBtn = screen.getAllByText("Preview segment →")[0];
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(screen.getAllByText("50 users targeted")[0]).toBeDefined();
      expect(screen.getAllByText("John Doe · john@test.com")[0]).toBeDefined();
    });
  });

  it("handles segment preview error", async () => {
    adminService.previewSegment.mockRejectedValue(new Error("Failed preview"));
    render(<AdminCampaigns />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /New Campaign/i })[0],
    );
    fireEvent.click(screen.getAllByText("Preview segment →")[0]);

    await waitFor(() => {
      expect(adminService.previewSegment).toHaveBeenCalled();
      // Should not show preview results
      expect(screen.queryByText("50 users targeted")).not.toBeInTheDocument();
    });
  });

  it("handles campaign creation successfully", async () => {
    render(<AdminCampaigns />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /New Campaign/i })[0],
    );

    const nameInput = screen.getByPlaceholderText(/e.g. July Renewal Push/i);
    fireEvent.change(nameInput, { target: { value: "New Campaign" } });

    const titleInput = screen.getByPlaceholderText(/Notification Title \*/i);
    fireEvent.change(titleInput, { target: { value: "Hey there" } });

    const bodyInput = screen.getByPlaceholderText(
      /Notification body message \*/i,
    );
    fireEvent.change(bodyInput, { target: { value: "Check this out" } });

    const submitBtn = screen.getAllByRole("button", {
      name: /Create Campaign/i,
    })[0];
    fireEvent.submit(submitBtn.closest("form"));

    await waitFor(() => {
      expect(adminService.createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Campaign",
          notification: expect.objectContaining({ title: "Hey there" }),
        }),
      );
      // Form should close and campaigns should refresh
      expect(screen.queryByRole("heading", { name: "Create Campaign" })).not.toBeInTheDocument();
      expect(adminService.getCampaigns).toHaveBeenCalledTimes(2);
    });
  });

  it("handles campaign creation error", async () => {
    adminService.createCampaign.mockRejectedValue(new Error("Creation failed"));
    render(<AdminCampaigns />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /New Campaign/i })[0],
    );

    const nameInput = screen.getByPlaceholderText(/e.g. July Renewal Push/i);
    fireEvent.change(nameInput, { target: { value: "New Campaign" } });

    const titleInput = screen.getByPlaceholderText(/Notification Title \*/i);
    fireEvent.change(titleInput, { target: { value: "Hey there" } });

    const bodyInput = screen.getByPlaceholderText(
      /Notification body message \*/i,
    );
    fireEvent.change(bodyInput, { target: { value: "Check this out" } });

    const submitBtn = screen.getAllByRole("button", {
      name: /Create Campaign/i,
    })[0];
    fireEvent.submit(submitBtn.closest("form"));

    await waitFor(() => {
      expect(adminService.createCampaign).toHaveBeenCalled();
      // Form should remain open
      expect(screen.getByRole("heading", { name: "Create Campaign" })).toBeInTheDocument();
    });
  });

  it("handles campaign sending", async () => {
    render(<AdminCampaigns />);

    await waitFor(() => screen.getAllByText("Renewal Drive")[0]);

    const sendBtn = screen.getAllByRole("button", { name: /Send Now/i })[0];
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(adminService.sendCampaign).toHaveBeenCalledWith("camp1");
      expect(adminService.getCampaigns).toHaveBeenCalledTimes(2);
    });
  });

  it("handles campaign sending error", async () => {
    adminService.sendCampaign.mockRejectedValue(new Error("Send failed"));
    render(<AdminCampaigns />);

    await waitFor(() => screen.getAllByText("Renewal Drive")[0]);

    const sendBtn = screen.getAllByRole("button", { name: /Send Now/i })[0];
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(adminService.sendCampaign).toHaveBeenCalledWith("camp1");
    });
  });

  it("handles campaign deletion", async () => {
    render(<AdminCampaigns />);

    await waitFor(() => screen.getAllByText("Renewal Drive")[0]);

    const deleteBtn = screen.getAllByLabelText("Delete Campaign")[0];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(adminService.deleteCampaign).toHaveBeenCalledWith("camp1");
      expect(adminService.getCampaigns).toHaveBeenCalledTimes(2);
    });
  });

  it("handles campaign deletion error", async () => {
    adminService.deleteCampaign.mockRejectedValue(new Error("Delete failed"));
    render(<AdminCampaigns />);

    await waitFor(() => screen.getAllByText("Renewal Drive")[0]);

    const deleteBtn = screen.getAllByLabelText("Delete Campaign")[0];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(adminService.deleteCampaign).toHaveBeenCalledWith("camp1");
    });
  });

  it("handles campaign form inputs and cancel", async () => {
    render(<AdminCampaigns />);

    // Open modal
    fireEvent.click(
      screen.getAllByRole("button", { name: /New Campaign/i })[0],
    );

    // Toggle plans
    const freePlanBtn = screen.getByRole("button", { name: /free/i });
    fireEvent.click(freePlanBtn); // Toggle on
    expect(freePlanBtn).toHaveClass("bg-indigo-600");
    fireEvent.click(freePlanBtn); // Toggle off

    // Min Loyalty Points
    const minPointsInput = screen.getByPlaceholderText("0");
    fireEvent.change(minPointsInput, { target: { value: "100" } });
    expect(minPointsInput).toHaveValue(100);

    // Inactive Since (lastLoginBefore)
    const dateInput =
      minPointsInput.parentElement.nextElementSibling.querySelector("input");
    fireEvent.change(dateInput, { target: { value: "2023-01-01" } });
    expect(dateInput).toHaveValue("2023-01-01");

    // Click Cancel
    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Form should close
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Create Campaign" })).not.toBeInTheDocument();
    });
  });

  it("handles campaign type change and closing modal via X button", async () => {
    render(<AdminCampaigns />);

    // Open modal
    fireEvent.click(
      screen.getAllByRole("button", { name: /New Campaign/i })[0],
    );

    // Change campaign type
    const typeSelect = screen.getByRole("combobox");
    fireEvent.change(typeSelect, { target: { value: "recurring" } });
    expect(typeSelect).toHaveValue("recurring");

    // Close modal via X button
    const createCampaignHeading = screen.getAllByText("Create Campaign")[0];
    const xButton = createCampaignHeading.nextElementSibling;
    fireEvent.click(xButton);

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Create Campaign" })).not.toBeInTheDocument();
    });
  });

  it("handles initial fetch error", async () => {
    adminService.getCampaigns.mockRejectedValue(new Error("Fetch failed"));
    render(<AdminCampaigns />);

    await waitFor(() => {
      expect(adminService.getCampaigns).toHaveBeenCalled();
      // Displays empty state or toast, so "No Campaigns Yet" will be shown due to empty array fallback
      expect(screen.getByText("No Campaigns Yet")).toBeInTheDocument();
    });
  });
});
