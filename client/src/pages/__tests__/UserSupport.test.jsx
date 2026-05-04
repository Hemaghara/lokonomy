import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import UserSupport from "../UserSupport";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supportService } from "../../services";
import { toast } from "react-hot-toast";

// Mock supportService
vi.mock("../../services", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    supportService: {
      ...actual.supportService,
      getTickets: vi.fn().mockResolvedValue({
        data: {
          tickets: [
            {
              _id: "t1",
              ticketNumber: "TCK-001",
              subject: "Login issue",
              status: "open",
              priority: "high",
              description: "Test description 1",
              category: "general",
              createdAt: new Date().toISOString(),
            },
            {
              _id: "t2",
              ticketNumber: "TCK-002",
              subject: "Payment failed",
              status: "resolved",
              priority: "medium",
              description: "Test description 2",
              category: "billing",
              createdAt: new Date().toISOString(),
            },
          ],
        },
      }),
      createTicket: vi.fn().mockResolvedValue({ success: true }),
    },
  };
});

// Redundant toast mock removed to use global mock from vitest.setup.js

describe("UserSupport Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders support header and tickets list", async () => {
    render(<UserSupport />);

    expect(screen.getByText(/Support Center/i)).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText("Login issue")).toBeDefined();
      expect(screen.getByText("#TCK-001")).toBeDefined();
      expect(screen.getByText("open")).toBeDefined();
    });
  });

  it("shows empty state when no tickets exist", async () => {
    supportService.getTickets.mockResolvedValueOnce({ data: { tickets: [] } });
    render(<UserSupport />);

    await waitFor(() => {
      expect(
        screen.getByText(/You haven't raised any tickets yet/i),
      ).toBeDefined();
    });
  });

  it("toggles ticket creation form", () => {
    render(<UserSupport />);

    const raiseBtn = screen.getByRole("button", { name: /Raise a Ticket/i });
    fireEvent.click(raiseBtn);

    expect(screen.getByText(/Subject/i)).toBeDefined();
    expect(
      screen.getByPlaceholderText(/Briefly describe the issue/i),
    ).toBeDefined();

    const cancelBtn = screen.getByText(/View My Tickets/i);
    fireEvent.click(cancelBtn);
    expect(screen.queryByText(/Subject/i)).toBeNull();
  });

  it("submits a new ticket successfully", async () => {
    render(<UserSupport />);

    fireEvent.click(screen.getByRole("button", { name: /Raise a Ticket/i }));

    fireEvent.change(
      screen.getByPlaceholderText(/Briefly describe the issue/i),
      { target: { value: "Bug Report" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText(/Tell us more about the problem.../i),
      { target: { value: "Something is broken" } },
    );

    // Select category (since combobox might be category)
    const categorySelect = screen.getByRole("combobox");
    fireEvent.change(categorySelect, { target: { value: "technical" } });

    const submitBtn = screen.getByRole("button", { name: /Submit Ticket/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(supportService.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Bug Report",
          description: "Something is broken",
          category: "technical",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Ticket raised successfully!",
      );
      expect(screen.queryByText(/Subject/i)).toBeNull(); // Form closed
    });
  });

  it("shows validation errors for empty fields", async () => {
    render(<UserSupport />);
    fireEvent.click(screen.getByRole("button", { name: /Raise a Ticket/i }));

    const submitBtn = screen.getByRole("button", { name: /Submit Ticket/i });
    fireEvent.click(submitBtn);

    // native validation might be used, but we check if createTicket was NOT called
    expect(supportService.createTicket).not.toHaveBeenCalled();
  });

  it("handles ticket creation failure", async () => {
    supportService.createTicket.mockRejectedValueOnce(
      new Error("Server Error"),
    );
    render(<UserSupport />);

    fireEvent.click(screen.getByRole("button", { name: /Raise a Ticket/i }));
    fireEvent.change(
      screen.getByPlaceholderText(/Briefly describe the issue/i),
      { target: { value: "Test" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText(/Tell us more about the problem.../i),
      { target: { value: "Test" } },
    );

    fireEvent.click(screen.getByRole("button", { name: /Submit Ticket/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to raise ticket",
      );
    });
  });

  it("displays different status colors", async () => {
    render(<UserSupport />);
    await waitFor(() => {
      const openBadge = screen.getByText("open");
      // Open is green in the component
      expect(openBadge.className).toContain("text-emerald-600");
    });
  });
});
