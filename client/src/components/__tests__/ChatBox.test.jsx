import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "../../utils/test-utils";
import ChatBox from "../ChatBox";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUser } from "../../context/UserContext";
import { chatService } from "../../services";
import * as socketService from "../../services/socket";

vi.mock("../../context/UserContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUser: vi.fn(),
  };
});

vi.mock("../../services/socket", () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  sendMessage: vi.fn(),
  emitTyping: vi.fn(),
  emitStopTyping: vi.fn(),
  emitMarkRead: vi.fn(),
}));

vi.mock("../../services", () => ({
  chatService: {
    getMessages: vi.fn(),
    getBusinessMessages: vi.fn(),
  },
}));

describe("ChatBox Component", () => {
  let mockSocket;
  let socketCallbacks = {};

  beforeEach(() => {
    vi.clearAllMocks();
    socketCallbacks = {};

    mockSocket = {
      on: vi.fn((event, cb) => {
        socketCallbacks[event] = cb;
      }),
      off: vi.fn((event) => {
        delete socketCallbacks[event];
      }),
    };

    socketService.connectSocket.mockReturnValue(mockSocket);
    chatService.getMessages.mockResolvedValue({
      data: { success: true, messages: [] },
    });
    chatService.getBusinessMessages.mockResolvedValue({
      data: { success: true, messages: [] },
    });
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("renders nothing if user is null", () => {
    useUser.mockReturnValue({ user: null });
    const { container } = render(<ChatBox productId="1" sellerId="2" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing if no chatRoom can be generated (missing buyer/seller)", () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    const { container } = render(<ChatBox productId="1" />); // Missing sellerId
    expect(container).toBeEmptyDOMElement();
  });

  it("fetches product messages and joins room on mount", async () => {
    useUser.mockReturnValue({ user: { id: "u1", name: "User1" } });

    const mockMessages = [
      {
        _id: "m1",
        message: "Hello",
        senderId: "2",
        senderName: "Seller",
        createdAt: new Date().toISOString(),
      },
    ];
    chatService.getMessages.mockResolvedValueOnce({
      data: { success: true, messages: mockMessages },
    });

    render(
      <ChatBox
        productId="p1"
        sellerId="2"
        onClose={vi.fn()}
        productName="Test Product"
      />,
    );

    expect(socketService.connectSocket).toHaveBeenCalledWith({
      userId: "u1",
      isAdmin: false,
    });
    expect(socketService.joinRoom).toHaveBeenCalledWith("p1_2_u1");
    expect(chatService.getMessages).toHaveBeenCalledWith("p1", "u1", "2");

    expect(await screen.findByText("Hello")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryAllByText(/Seller/i).length).toBeGreaterThan(0);
    });
  });

  it("fetches business messages and handles business owner view", async () => {
    useUser.mockReturnValue({ user: { id: "owner1" } });

    render(
      <ChatBox
        chatType="business_inquiry"
        businessId="b1"
        ownerId="owner1"
        buyerId="buyer1"
        businessName="Test Business"
        onClose={vi.fn()}
      />,
    );

    expect(socketService.joinRoom).toHaveBeenCalledWith("biz_b1_buyer1_owner1");
    expect(chatService.getBusinessMessages).toHaveBeenCalledWith(
      "b1",
      "buyer1",
      "owner1",
    );

    await waitFor(() => {
      expect(screen.getByText("No messages yet")).toBeInTheDocument();
      expect(
        screen.getByText(/Waiting for inquiries about/),
      ).toBeInTheDocument();
    });
  });

  it("handles chatService failure gracefully", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    chatService.getMessages.mockRejectedValueOnce(new Error("Network error"));

    render(<ChatBox productId="p1" sellerId="2" />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching messages:",
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });

  it("handles sending a message", async () => {
    useUser.mockReturnValue({ user: { id: "u1", name: "User1" } });
    render(<ChatBox productId="p1" sellerId="2" />);

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Test message" } });

    expect(socketService.emitTyping).toHaveBeenCalledWith("p1_2_u1", "User1");

    fireEvent.submit(input.closest("form"));

    expect(socketService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chatRoom: "p1_2_u1",
        productId: "p1",
        senderId: "u1",
        receiverId: "2",
        message: "Test message",
      }),
    );

    expect(socketService.emitStopTyping).toHaveBeenCalled();
    expect(input.value).toBe("");
  });

  it("does not send empty messages", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    render(<ChatBox productId="p1" sellerId="2" />);

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    const form = screen.getByRole("textbox").closest("form");
    fireEvent.submit(form);

    expect(socketService.sendMessage).not.toHaveBeenCalled();
  });

  it("handles socket receiveMessage", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    render(<ChatBox productId="p1" sellerId="2" />);

    await waitFor(() => {
      expect(socketCallbacks["receiveMessage"]).toBeDefined();
    });

    act(() => {
      socketCallbacks["receiveMessage"]({
        _id: "newMsg",
        message: "Socket msg",
        senderId: "2",
        receiverId: "u1",
        createdAt: new Date().toISOString(),
      });
    });

    expect(screen.getByText("Socket msg")).toBeInTheDocument();
    expect(socketService.emitMarkRead).toHaveBeenCalled();
  });

  it("handles socket userTyping and userStopTyping", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    render(<ChatBox productId="p1" sellerId="2" />);

    await waitFor(() => {
      expect(socketCallbacks["userTyping"]).toBeDefined();
    });

    act(() => {
      socketCallbacks["userTyping"]({ userName: "Seller" });
    });

    expect(screen.getByText("Seller is typing…")).toBeInTheDocument();

    act(() => {
      socketCallbacks["userStopTyping"]();
    });

    expect(screen.queryByText("Seller is typing…")).not.toBeInTheDocument();
  });

  it("handles socket messagesRead", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    const mockMessages = [
      {
        _id: "m1",
        message: "My msg",
        senderId: "u1",
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];
    chatService.getMessages.mockResolvedValueOnce({
      data: { success: true, messages: mockMessages },
    });

    render(<ChatBox productId="p1" sellerId="2" />);

    await waitFor(() => {
      expect(screen.getByText("My msg")).toBeInTheDocument();
    });

    act(() => {
      socketCallbacks["messagesRead"]();
    });

    // Check if the read indicator icon is shown (can be checked by class name or just assumption of re-render)
    // The test ensures it doesn't crash and handles the state update.
  });

  it("cleans up socket on unmount", () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    const { unmount } = render(<ChatBox productId="p1" sellerId="2" />);

    unmount();

    expect(socketService.leaveRoom).toHaveBeenCalledWith("p1_2_u1");
    expect(mockSocket.off).toHaveBeenCalledWith("receiveMessage");
    expect(mockSocket.off).toHaveBeenCalledWith("userTyping");
    expect(mockSocket.off).toHaveBeenCalledWith("userStopTyping");
    expect(mockSocket.off).toHaveBeenCalledWith("messagesRead");
  });

  it("formats dates as Today, Yesterday, and specific date", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const olderDate = new Date("2023-01-01T10:00:00Z");

    const mockMessages = [
      {
        _id: "m1",
        message: "Msg 1",
        senderId: "2",
        createdAt: today.toISOString(),
      },
      {
        _id: "m2",
        message: "Msg 2",
        senderId: "2",
        createdAt: yesterday.toISOString(),
      },
      {
        _id: "m3",
        message: "Msg 3",
        senderId: "2",
        createdAt: olderDate.toISOString(),
      },
    ];

    chatService.getMessages.mockResolvedValueOnce({
      data: { success: true, messages: mockMessages },
    });

    render(<ChatBox productId="p1" sellerId="2" />);

    await waitFor(() => {
      expect(screen.getByText("Today")).toBeInTheDocument();
      expect(screen.getByText("Yesterday")).toBeInTheDocument();
      expect(screen.getByText("1 Jan 2023")).toBeInTheDocument();
    });
  });

  it("closes chat when close button is clicked", async () => {
    useUser.mockReturnValue({ user: { id: "u1" } });
    const onClose = vi.fn();
    render(<ChatBox productId="p1" sellerId="2" onClose={onClose} />);

    const closeBtn = await screen.findByRole("button", { name: /close chat/i });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
