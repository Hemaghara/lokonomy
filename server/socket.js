const { Server } = require("socket.io");
const Message = require("./models/Message");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Track online users and typing states
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    // Register the user as online
    socket.on("registerUser", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`👤 User registered: ${userId}`);
    });

    // Join a specific chat room
    socket.on("joinRoom", ({ chatRoom }) => {
      socket.join(chatRoom);
      console.log(`🚪 Socket ${socket.id} joined room: ${chatRoom}`);
    });

    // Leave a chat room
    socket.on("leaveRoom", ({ chatRoom }) => {
      socket.leave(chatRoom);
      console.log(`🚶 Socket ${socket.id} left room: ${chatRoom}`);
    });

    // Handle sending a message
    socket.on("sendMessage", async (data) => {
      try {
        const {
          chatRoom,
          productId,
          senderId,
          receiverId,
          senderName,
          message,
        } = data;

        // Save message to database
        const newMessage = new Message({
          chatRoom,
          productId,
          senderId,
          receiverId,
          senderName,
          message,
        });

        const savedMessage = await newMessage.save();

        // Emit to the room (both sender and receiver see it)
        io.to(chatRoom).emit("receiveMessage", savedMessage);

        // Also notify the receiver if they're online but not in the room
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessageNotification", {
            chatRoom,
            message: savedMessage,
          });
        }
      } catch (err) {
        console.error("Error saving message:", err);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing", ({ chatRoom, userName }) => {
      socket.to(chatRoom).emit("userTyping", { userName });
    });

    // Handle stop typing
    socket.on("stopTyping", ({ chatRoom }) => {
      socket.to(chatRoom).emit("userStopTyping");
    });

    // Mark messages as read in real-time
    socket.on("markRead", async ({ chatRoom, userId }) => {
      try {
        const mongoose = require("mongoose");
        let receiverQuery;
        try {
          receiverQuery = new mongoose.Types.ObjectId(userId);
        } catch (_) {
          receiverQuery = userId; // fallback to string if invalid ObjectId
        }
        await Message.updateMany(
          { chatRoom, receiverId: receiverQuery, read: false },
          { $set: { read: true } },
        );
        // Notify everyone in the room that messages were read
        io.to(chatRoom).emit("messagesRead", { chatRoom, userId });
      } catch (err) {
        console.error("Error marking messages read:", err);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      // Remove from online users
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;
