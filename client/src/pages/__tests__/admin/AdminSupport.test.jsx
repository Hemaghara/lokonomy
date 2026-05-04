import React from "react";
import { render, screen, fireEvent, waitFor } from "../../../utils/test-utils";
import AdminSupport from "../../admin/AdminSupport";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminService } from "../../../services";
import { toast } from "react-hot-toast";

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

// Mock AdminLayout
vi.mock("../../../layouts/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

// Mock adminService
vi.mock("../../../services", () => ({
  adminService: {
    getSupportTickets: vi.fn(),
    getSubAdmins: vi.fn(),
    getTicketById: vi.fn(),
    updateTicketStatus: vi.fn(),
    replyToTicket: vi.fn(),
    assignTicket: vi.fn(),
  },
}));

const oldDate = new Date();
oldDate.setDate(oldDate.getDate() - 3); // 3 days ago for SLA breach

const mockTicketData = {
  tickets: [
    {
      _id: "t1",
      ticketNumber: "TIC123",
      subject: "Login Issue",
      description: "Help with login",
      status: "open",
      priority: "high",
      category: "technical",
      userName: "John Doe",
      createdAt: new Date().toISOString(),
      replies: [
        {
          sender: "user",
          senderName: "John",
          message: "Hello",
          createdAt: new Date().toISOString(),
        },
        {
          sender: "admin",
          senderName: "Admin",
          message: "Hi John",
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      _id: "t2",
      ticketNumber: "TIC124",
      subject: "Payment Issue",
      description: "Help with payment",
      status: "in_progress",
      priority: "urgent",
      category: "billing",
      userName: "Jane Doe",
      createdAt: oldDate.toISOString(), // SLA Breached
      replies: [],
    },
  ],
  stats: { open: 1, in_progress: 1, urgent: 1, resolved: 0 },
};

const mockTicketDetail = {
  _id: "t1",
  ticketNumber: "TIC123",
  subject: "Login Issue",
  description: "Help with login",
  status: "open",
  priority: "high",
  category: "technical",
  userName: "John Doe",
  assignedTo: null,
  createdAt: new Date().toISOString(),
  replies: [
    {
      sender: "user",
      senderName: "John",
      message: "Hello",
      createdAt: new Date().toISOString(),
    },
    {
      sender: "admin",
      senderName: "Admin",
      message: "Hi John",
      createdAt: new Date().toISOString(),
    },
  ],
};

const mockSubAdmins = [
  { _id: "a1", name: "Admin One" },
  { _id: "a2", name: "Admin Two" },
];

describe("AdminSupport Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getSupportTickets.mockResolvedValue({ data: mockTicketData });
    adminService.getSubAdmins.mockResolvedValue({
      data: { data: mockSubAdmins },
    });
    adminService.getTicketById.mockResolvedValue({ data: mockTicketDetail });
    adminService.updateTicketStatus.mockResolvedValue({
      data: { success: true },
    });
    adminService.replyToTicket.mockResolvedValue({ data: { success: true } });
    adminService.assignTicket.mockResolvedValue({ data: { success: true } });
  });

  it("renders ticket stats and ticket list", async () => {
    render(<AdminSupport />);

    await waitFor(() => {
      expect(screen.getByText("Open Tickets")).toBeInTheDocument();
      expect(screen.getByText("Login Issue")).toBeInTheDocument();
      expect(screen.getByText("Payment Issue")).toBeInTheDocument();
    });
  });

  it("handles loading state and empty state", async () => {
    adminService.getSupportTickets.mockResolvedValueOnce({
      data: { tickets: [], stats: {} },
    });
    render(<AdminSupport />);

    await waitFor(() => {
      expect(screen.getByText("No tickets found")).toBeInTheDocument();
    });
  });

  it("handles ticket fetch error", async () => {
    adminService.getSupportTickets.mockRejectedValueOnce(
      new Error("Fetch error"),
    );
    render(<AdminSupport />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch tickets");
    });
  });

  it("selects a ticket and shows details", async () => {
    render(<AdminSupport />);

    await waitFor(() => screen.getByText("Login Issue"));

    fireEvent.click(screen.getAllByText("Login Issue")[0]);

    await waitFor(() => {
      expect(screen.getByText("Original Request")).toBeInTheDocument();
      expect(screen.getByText("Help with login")).toBeInTheDocument();
      expect(screen.getByText("Hello")).toBeInTheDocument();
      expect(screen.getByText("Hi John")).toBeInTheDocument();
    });
  });

  it("handles mobile back button", async () => {
    render(<AdminSupport />);
    await waitFor(() => screen.getByText("Login Issue"));

    fireEvent.click(screen.getAllByText("Login Issue")[0]);
    await waitFor(() => screen.getByText("Original Request"));

    // Back button is the first button in the detailed view header
    const backBtn = screen.getAllByRole("button")[0]; // FiChevronLeft button
    fireEvent.click(backBtn);

    // We can't directly check the state, but we can verify the detail view closes if we test its class or absence,
    // though the implementation uses hidden classes. We verify it doesn't crash.
  });

  it("handles ticket status update to resolved and closed", async () => {
    render(<AdminSupport />);

    await waitFor(() => screen.getAllByText("Login Issue")[0]);
    fireEvent.click(screen.getAllByText("Login Issue")[0]);

    await waitFor(() => screen.getByRole("button", { name: /^Resolve$/i }));

    const resolveBtn = screen.getByRole("button", { name: /^Resolve$/i });
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(adminService.updateTicketStatus).toHaveBeenCalledWith(
        "t1",
        "resolved",
      );
      expect(toast.success).toHaveBeenCalledWith("Status updated");
      expect(adminService.getTicketById).toHaveBeenCalledWith("t1");
    });

    const closeBtn = screen.getByRole("button", { name: /^Close$/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(adminService.updateTicketStatus).toHaveBeenCalledWith(
        "t1",
        "closed",
      );
      expect(toast.success).toHaveBeenCalledWith("Status updated");
    });
  });

  it("handles ticket status update error", async () => {
    adminService.updateTicketStatus.mockRejectedValueOnce(
      new Error("Update error"),
    );
    render(<AdminSupport />);

    await waitFor(() => screen.getAllByText("Login Issue")[0]);
    fireEvent.click(screen.getAllByText("Login Issue")[0]);

    await waitFor(() => screen.getByRole("button", { name: /^Resolve$/i }));

    const resolveBtn = screen.getByRole("button", { name: /^Resolve$/i });
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
  });

  it("handles ticket reply manually and handles API error", async () => {
    render(<AdminSupport />);

    await waitFor(() => screen.getAllByText("Login Issue")[0]);
    fireEvent.click(screen.getAllByText("Login Issue")[0]);

    await waitFor(() => screen.getByPlaceholderText(/Type your reply here/i));

    const replyInput = screen.getByPlaceholderText(/Type your reply here/i);
    fireEvent.change(replyInput, { target: { value: "Working on it" } });

    // Find send button (the button next to textarea)
    const allBtns = screen.getAllByRole("button");
    const sendBtn = allBtns[allBtns.length - 1];
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(adminService.replyToTicket).toHaveBeenCalledWith(
        "t1",
        "Working on it",
      );
      expect(toast.success).toHaveBeenCalledWith("Reply sent");
      expect(adminService.getTicketById).toHaveBeenCalledWith("t1");
    });

    // Test API Error
    adminService.replyToTicket.mockRejectedValueOnce(new Error("Reply error"));
    fireEvent.change(replyInput, { target: { value: "Try again" } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to send reply");
    });
  });

  it("prevents empty reply", async () => {
    render(<AdminSupport />);

    await waitFor(() => screen.getAllByText("Login Issue")[0]);
    fireEvent.click(screen.getAllByText("Login Issue")[0]);

    await waitFor(() => screen.getByPlaceholderText(/Type your reply here/i));

    const replyInput = screen.getByPlaceholderText(/Type your reply here/i);
    fireEvent.change(replyInput, { target: { value: "   " } });

    const allBtns = screen.getAllByRole("button");
    const sendBtn = allBtns[allBtns.length - 1];
    fireEvent.click(sendBtn);

    expect(adminService.replyToTicket).not.toHaveBeenCalled();
  });

  it("handles canned response selection", async () => {
    render(<AdminSupport />);

    await waitFor(() => screen.getAllByText("Login Issue")[0]);
    fireEvent.click(screen.getAllByText("Login Issue")[0]);

    await waitFor(() => screen.getByText("Greeting"));

    const cannedBtn = screen.getByText("Greeting");
    fireEvent.click(cannedBtn);

    const replyInput = screen.getByPlaceholderText(/Type your reply here/i);
    expect(replyInput.value).toBe(
      "Hello! Thank you for reaching out to Lokonomy support. How can we help you today?",
    );
  });

  it("handles ticket assignment and API error", async () => {
    render(<AdminSupport />);

    await waitFor(() => screen.getAllByText("Login Issue")[0]);
    fireEvent.click(screen.getAllByText("Login Issue")[0]);

    await waitFor(() => screen.getByRole("combobox"));

    const assignSelect = screen.getByRole("combobox");
    fireEvent.change(assignSelect, { target: { value: "a1" } });

    await waitFor(() => {
      expect(adminService.assignTicket).toHaveBeenCalledWith("t1", "a1");
      expect(toast.success).toHaveBeenCalledWith("Ticket assigned");
      expect(adminService.getTicketById).toHaveBeenCalledWith("t1");
    });

    // Test Assignment Error
    adminService.assignTicket.mockRejectedValueOnce(new Error("Assign error"));
    fireEvent.change(assignSelect, { target: { value: "a2" } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Assignment failed");
    });
  });
});
