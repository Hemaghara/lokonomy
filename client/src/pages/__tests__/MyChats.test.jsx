import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import MyChats from "../MyChats";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { chatService } from "../../services";

// Mock chatService
vi.mock("../../services", () => ({
  chatService: {
    getConversations: vi.fn(),
  },
}));

// Mock ChatBox to avoid complex nested rendering
vi.mock("../../components/ChatBox", () => ({
  default: ({ otherUserName, onClose }) => (
    <div data-testid="chat-box">
      <h2>Chat with {otherUserName}</h2>
      <button onClick={onClose}>Close Chat</button>
    </div>
  ),
}));

const mockChats = [
  {
    _id: "chat-1",
    chatType: "product",
    otherUserName: "Alice",
    lastMessage: "Is it still available?",
    lastMessageAt: new Date().toISOString(),
    unreadCount: 1,
    product: { productName: "iPhone 13" },
    productId: "p1",
    sellerId: "s1",
    buyerId: "b1",
  },
  {
    _id: "chat-2",
    chatType: "business_inquiry",
    otherUserName: "Bob",
    lastMessage: "What are your hours?",
    lastMessageAt: new Date().toISOString(),
    unreadCount: 2,
    business: { businessName: "Coffee Shop" },
    businessId: "bus1",
  },
  {
    _id: "chat-3",
    chatType: "product",
    otherUserName: "Charlie",
    lastMessage: "Price negotiable?",
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    product: { productName: "MacBook" },
    lastSenderId: "mock-user-id", // Matches mock user ID in test-utils
  },
];

describe("MyChats Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chatService.getConversations.mockResolvedValue({
      data: { success: true, chats: mockChats },
    });
  });

  it("renders loading state initially", async () => {
    chatService.getConversations.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<MyChats />);
    expect(screen.getByText(/Loading chats.../i)).toBeInTheDocument();
  });

  it("renders chat list and defaults to product tab", async () => {
    render(<MyChats />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("iPhone 13")).toBeInTheDocument();
      expect(screen.getByText("MacBook")).toBeInTheDocument();
    });

    // Check for "You: " prefix for Charlie's message
    expect(screen.getByText(/You: Price negotiable\?/i)).toBeInTheDocument();

    // Bob (business) should not be visible
    expect(screen.queryByText("Bob")).toBeNull();
  });

  it("displays correct unread counts on tabs and items", async () => {
    render(<MyChats />);

    await waitFor(() => {
      // Alice has 1 unread, Charlie has 0. Total product unread = 1
      const productTab = screen.getByRole("button", { name: /Products/i });
      expect(productTab).toHaveTextContent("1");

      const aliceUnreadBadge = screen.getByText("1", {
        selector: "span.bg-violet-600",
      });
      expect(aliceUnreadBadge).toBeInTheDocument();
    });

    const businessTab = screen.getByRole("button", { name: /Business/i });
    expect(businessTab).toHaveTextContent("2"); // Bob has 2 unread
  });

  it("switches to business tab and shows empty state if no chats", async () => {
    const mockNavigate = vi.fn();
    vi.mock("react-router-dom", async (importOriginal) => {
      const actual = await importOriginal();
      return { ...actual, useNavigate: () => mockNavigate };
    });

    chatService.getConversations.mockResolvedValueOnce({
      data: { success: true, chats: [] },
    });

    render(<MyChats />);

    await waitFor(() => {
      expect(screen.getByText(/No product chats/i)).toBeInTheDocument();
    });

    const businessTab = screen.getByRole("button", { name: /Business/i });
    fireEvent.click(businessTab);

    expect(screen.getByText(/No business inquiries/i)).toBeInTheDocument();
  });

  it("opens and closes chat box", async () => {
    render(<MyChats />);

    await waitFor(() => screen.getByText("Alice"));
    fireEvent.click(screen.getByText("Alice"));

    expect(screen.getByTestId("chat-box")).toBeInTheDocument();
    expect(screen.getByText("Chat with Alice")).toBeInTheDocument();

    // Close chat
    fireEvent.click(screen.getByText(/Close Chat/i));

    await waitFor(() => {
      expect(screen.queryByTestId("chat-box")).toBeNull();
      // Should refresh chats on close
      expect(chatService.getConversations).toHaveBeenCalledTimes(2);
    });
  });

  it("handles API error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    chatService.getConversations.mockRejectedValue(new Error("Network Error"));

    render(<MyChats />);

    await waitFor(() => {
      expect(screen.getByText(/No product chats/i)).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching chats:",
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });

  it("formats dates correctly", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    chatService.getConversations.mockResolvedValue({
      data: {
        success: true,
        chats: [
          {
            ...mockChats[0],
            lastMessageAt: yesterday.toISOString(),
          },
        ],
      },
    });

    render(<MyChats />);

    await waitFor(() => {
      // Should show date instead of time for non-today messages
      const dateText = yesterday.toLocaleDateString([], {
        day: "numeric",
        month: "short",
      });
      expect(screen.getByText(dateText)).toBeInTheDocument();
    });
  });
});
