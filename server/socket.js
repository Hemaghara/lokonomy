const { Server } = require("socket.io");
const Message = require("./models/Message");
const { createNotification } = require("./controllers/notificationController");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const onlineUsers = new Map(); 

  const emitOnlineCount = () => {
    const regularUsers = Array.from(onlineUsers.entries())
      .filter(([_, u]) => !u.isAdmin && u.socketIds.size > 0);
    
    const count = regularUsers.length;
    const userIds = regularUsers.map(([id]) => id);
    
    console.log(`[Socket] Broadcasting count: ${count} (${userIds.join(', ') || 'None'})`);
    io.emit("onlineUsersCount", count);
  };

  io.on("connection", (socket) => {
    console.log(`[Socket] New raw connection: ${socket.id}`);

    
    const currentCount = Array.from(onlineUsers.values()).filter(u => !u.isAdmin && u.socketIds.size > 0).length;
    socket.emit("onlineUsersCount", currentCount);

    socket.on("registerUser", (data) => {
      const userId = typeof data === "string" ? data : data.userId;
      const isAdmin =
        typeof data === "object"
          ? !!data.isAdmin
          : userId === "admin" || userId.includes("admin") || userId.startsWith("admin_");

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, { socketIds: new Set(), isAdmin: isAdmin });
      } else {
        onlineUsers.get(userId).isAdmin = isAdmin;
      }
      
      onlineUsers.get(userId).socketIds.add(socket.id);
      socket.join(`user_${userId}`);

      console.log(`[Socket] REGISTERED: ${isAdmin ? 'ADMIN' : 'USER'} | ID: ${userId} | Current Sockets: ${onlineUsers.get(userId).socketIds.size}`);
      
      emitOnlineCount();
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
          businessId,
          chatType,
          senderId,
          receiverId,
          senderName,
          message,
        } = data;

        const newMessage = new Message({
          chatRoom,
          chatType: chatType || "product",
          productId: productId || null,
          businessId: businessId || null,
          senderId,
          receiverId,
          senderName,
          message,
        });

        const savedMessage = await newMessage.save();

        io.to(chatRoom).emit("receiveMessage", savedMessage);

        const receiverData = onlineUsers.get(receiverId);
        if (receiverData && receiverData.socketIds) {
          receiverData.socketIds.forEach((socketId) => {
            io.to(socketId).emit("newMessageNotification", {
              chatRoom,
              message: savedMessage,
            });
          });
        }

        const { sendPushNotification } = require("./utils/pushService");
        await sendPushNotification(receiverId, {
          title:
            chatType === "business_inquiry"
              ? `New Business Inquiry from ${senderName}`
              : `New message from ${senderName}`,
          body:
            message.length > 50 ? message.substring(0, 50) + "..." : message,
          data: {
            url: `/my-chats`,
            type: chatType === "business_inquiry" ? "business_inquiry" : "chat",
          },
        });

        await createNotification({
          recipientId: receiverId,
          type: "message",
          title:
            chatType === "business_inquiry"
              ? `New inquiry from ${senderName}`
              : `New message from ${senderName}`,
          message:
            message.length > 80 ? message.substring(0, 80) + "..." : message,
          actionUrl: "/my-chats",
          metadata: { chatRoom, senderId },
          io,
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
      let regularUserCompletelyOffline = false;
      for (const [userId, data] of onlineUsers.entries()) {
        if (data.socketIds.has(socket.id)) {
          data.socketIds.delete(socket.id);
          if (data.socketIds.size === 0) {
            if (!data.isAdmin) {
              regularUserCompletelyOffline = true;
            }
            onlineUsers.delete(userId);
          }
          break;
        }
      }
      if (regularUserCompletelyOffline) {
        emitOnlineCount();
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;
