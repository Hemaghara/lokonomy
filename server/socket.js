const { Server } = require("socket.io");
const Message = require("./models/Message");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("registerUser", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`User registered: ${userId}`);
    });

    socket.on("joinRoom", ({ chatRoom }) => {
      socket.join(chatRoom);
      console.log(`Socket ${socket.id} joined room: ${chatRoom}`);
    });

    socket.on("leaveRoom", ({ chatRoom }) => {
      socket.leave(chatRoom);
      console.log(`Socket ${socket.id} left room: ${chatRoom}`);
    });

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

        const newMessage = new Message({
          chatRoom,
          productId,
          senderId,
          receiverId,
          senderName,
          message,
        });

        const savedMessage = await newMessage.save();

        io.to(chatRoom).emit("receiveMessage", savedMessage);

        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessageNotification", {
            chatRoom,
            message: savedMessage,
          });
        }

        // Send push notification
        const { sendPushNotification } = require("./utils/pushService");
        await sendPushNotification(receiverId, {
          title: `New message from ${senderName}`,
          body: message.length > 50 ? message.substring(0, 50) + "..." : message,
          data: {
            url: `/chat/${chatRoom}`,
            type: "chat",
          },
        });
      } catch (err) {
        console.error("Error saving message:", err);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    socket.on("typing", ({ chatRoom, userName }) => {
      socket.to(chatRoom).emit("userTyping", { userName });
    });

    socket.on("stopTyping", ({ chatRoom }) => {
      socket.to(chatRoom).emit("userStopTyping");
    });

    socket.on("markRead", async ({ chatRoom, userId }) => {
      try {
        const mongoose = require("mongoose");
        let receiverQuery;
        try {
          receiverQuery = new mongoose.Types.ObjectId(userId);
        } catch (_) {
          receiverQuery = userId;
        }
        await Message.updateMany(
          { chatRoom, receiverId: receiverQuery, read: false },
          { $set: { read: true } },
        );

        io.to(chatRoom).emit("messagesRead", { chatRoom, userId });
      } catch (err) {
        console.error("Error marking messages read:", err);
      }
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;
