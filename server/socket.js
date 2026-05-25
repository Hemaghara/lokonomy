const { Server } = require("socket.io");
const Message = require("./models/Message");
const Business = require("./models/Business");
const OnlineStatus = require("./models/OnlineStatus");
const { createNotification } = require("./controllers/notificationController");
const logger = require("./utils/logger");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const onlineUsers = new Map();

  const emitOnlineCount = () => {
    const regularUsers = Array.from(onlineUsers.entries()).filter(
      ([_, u]) => !u.isAdmin && u.socketIds.size > 0,
    );

    const count = regularUsers.length;
    const userIds = regularUsers.map(([id]) => id);

    logger.debug({ count, userIds }, "[Socket] Broadcasting online user count");
    io.emit("onlineUsersCount", count);
  };

  io.on("connection", (socket) => {
    logger.debug({ socketId: socket.id }, "[Socket] New raw connection");

    const currentCount = Array.from(onlineUsers.values()).filter(
      (u) => !u.isAdmin && u.socketIds.size > 0,
    ).length;
    socket.emit("onlineUsersCount", currentCount);

    socket.on("registerUser", (data) => {
      const userId = typeof data === "string" ? data : data.userId;
      const isAdmin =
        typeof data === "object"
          ? !!data.isAdmin
          : userId === "admin" ||
          userId.includes("admin") ||
          userId.startsWith("admin_");

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, { socketIds: new Set(), isAdmin: isAdmin });
      } else {
        onlineUsers.get(userId).isAdmin = isAdmin;
      }

      onlineUsers.get(userId).socketIds.add(socket.id);
      socket.join(`user_${userId}`);

      logger.info(
        {
          role: isAdmin ? "ADMIN" : "USER",
          userId,
          socketCount: onlineUsers.get(userId).socketIds.size,
        },
        "[Socket] User registered",
      );

      emitOnlineCount();


      if (!isAdmin) {
        Business.updateMany(
          { ownerId: userId },
          { $set: { isOwnerOnline: true, lastOwnerActivity: new Date() } }
        ).then(async () => {
          const businesses = await Business.find({ ownerId: userId }, "_id activeVisitors");
          businesses.forEach(biz => {
            io.to(`business_${biz._id}`).emit("businessStatusUpdate", {
              businessId: biz._id.toString(),
              activeVisitors: biz.activeVisitors || 0,
              isOwnerOnline: true,
            });
          });
        }).catch(err => logger.error({ err }, "[Socket] Error updating business online status"));
      }
    });

    socket.on("joinRoom", ({ chatRoom }) => {
      socket.join(chatRoom);
      logger.debug(
        { socketId: socket.id, chatRoom },
        "[Socket] Socket joined room",
      );
    });

    socket.on("leaveRoom", ({ chatRoom }) => {
      socket.leave(chatRoom);
      logger.debug(
        { socketId: socket.id, chatRoom },
        "[Socket] Socket left room",
      );
    });

    socket.on("joinStoryFeed", ({ district }) => {
      if (district) {
        socket.join(`stories_${district}`);
        logger.debug(
          { socketId: socket.id, district },
          "[Socket] Joined story feed room",
        );
      }
    });


    socket.on("joinBusinessPage", ({ businessId }) => {
      if (businessId) {
        socket.join(`business_${businessId}`);
        Business.findByIdAndUpdate(businessId, { $inc: { activeVisitors: 1 } })
          .then(biz => {
            if (biz) {
              io.to(`business_${businessId}`).emit("businessStatusUpdate", {
                businessId,
                activeVisitors: (biz.activeVisitors || 0) + 1,
                isOwnerOnline: biz.isOwnerOnline,
              });
            }
          })
          .catch(err => logger.error({ err }, "[Socket] Error tracking business visitor"));

        if (!socket._visitingBusinesses) socket._visitingBusinesses = new Set();
        socket._visitingBusinesses.add(businessId);
        logger.debug({ socketId: socket.id, businessId }, "[Socket] Joined business page");
      }
    });

    socket.on("leaveBusinessPage", ({ businessId }) => {
      if (businessId) {
        socket.leave(`business_${businessId}`);
        Business.findByIdAndUpdate(businessId, { $inc: { activeVisitors: -1 } })
          .then(biz => {
            if (biz) {
              io.to(`business_${businessId}`).emit("businessStatusUpdate", {
                businessId,
                activeVisitors: Math.max(0, (biz.activeVisitors || 1) - 1),
                isOwnerOnline: biz.isOwnerOnline,
              });
            }
          })
          .catch(err => logger.error({ err }, "[Socket] Error tracking business visitor leave"));
        if (socket._visitingBusinesses) socket._visitingBusinesses.delete(businessId);
        logger.debug({ socketId: socket.id, businessId }, "[Socket] Left business page");
      }
    });

    socket.on("leaveStoryFeed", ({ district }) => {
      if (district) {
        socket.leave(`stories_${district}`);
        logger.debug(
          { socketId: socket.id, district },
          "[Socket] Left story feed room",
        );
      }
    });


    socket.on("joinFeedRoom", ({ feedId }) => {
      if (feedId) {
        socket.join(`feed_${feedId}`);
        logger.debug(
          { socketId: socket.id, feedId },
          "[Socket] Joined feed room",
        );
      }
    });

    socket.on("leaveFeedRoom", ({ feedId }) => {
      if (feedId) {
        socket.leave(`feed_${feedId}`);
        logger.debug(
          { socketId: socket.id, feedId },
          "[Socket] Left feed room",
        );
      }
    });

    socket.on("joinFeedDistrict", ({ district }) => {
      if (district) {
        socket.join(`feeds_${district}`);
        logger.debug(
          { socketId: socket.id, district },
          "[Socket] Joined feeds district room",
        );
      }
    });

    socket.on("leaveFeedDistrict", ({ district }) => {
      if (district) {
        socket.leave(`feeds_${district}`);
        logger.debug(
          { socketId: socket.id, district },
          "[Socket] Left feeds district room",
        );
      }
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

        // Chatbot Auto-Response Logic
        const receiverStr = receiverId.toString();
        const isReceiverOnline = onlineUsers.has(receiverStr) && onlineUsers.get(receiverStr).socketIds.size > 0;
        
        if (!isReceiverOnline) {
          const business = businessId 
            ? await Business.findById(businessId)
            : await Business.findOne({ ownerId: receiverId, autoResponseEnabled: true });
            
          if (business && business.autoResponseEnabled) {
            const incomingText = message.toLowerCase();
            let autoResponseText = "";
            
            if (business.autoResponses && business.autoResponses.length > 0) {
              const matched = business.autoResponses.find(r => 
                r.trigger && incomingText.includes(r.trigger.toLowerCase())
              );
              if (matched) {
                autoResponseText = matched.response;
              }
            }
            
            if (!autoResponseText) {
              autoResponseText = business.awayMessage || "Thank you for contacting us! We are currently away and will get back to you as soon as possible.";
            }

            setTimeout(async () => {
              try {
                const botMessage = new Message({
                  chatRoom,
                  chatType: chatType || "business_inquiry",
                  productId: productId || null,
                  businessId: business._id,
                  senderId: receiverId,
                  receiverId: senderId,
                  senderName: `${business.businessName} (Auto-Response)`,
                  message: autoResponseText,
                });
                
                const savedBotMsg = await botMessage.save();
                io.to(chatRoom).emit("receiveMessage", savedBotMsg);
                
                const senderData = onlineUsers.get(senderId.toString());
                if (senderData && senderData.socketIds) {
                  senderData.socketIds.forEach((socketId) => {
                    io.to(socketId).emit("newMessageNotification", {
                      chatRoom,
                      message: savedBotMsg,
                    });
                  });
                }
              } catch (err) {
                logger.error({ err }, "[Socket] Error sending chatbot auto-response");
              }
            }, 1000);
          }
        }

      } catch (err) {
        logger.error({ err }, "[Socket] Error saving message");
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
        logger.error({ err }, "[Socket] Error marking messages read");
      }
    });

    socket.on("disconnect", () => {
      let regularUserCompletelyOffline = false;
      let disconnectedUserId = null;
      for (const [userId, data] of onlineUsers.entries()) {
        if (data.socketIds.has(socket.id)) {
          data.socketIds.delete(socket.id);
          if (data.socketIds.size === 0) {
            if (!data.isAdmin) {
              regularUserCompletelyOffline = true;
            }
            disconnectedUserId = userId;
            onlineUsers.delete(userId);
          }
          break;
        }
      }
      if (regularUserCompletelyOffline) {
        emitOnlineCount();
      }
      logger.debug({ socketId: socket.id }, "[Socket] Socket disconnected");


      if (socket._visitingBusinesses && socket._visitingBusinesses.size > 0) {
        for (const bizId of socket._visitingBusinesses) {
          Business.findByIdAndUpdate(bizId, { $inc: { activeVisitors: -1 } })
            .then(biz => {
              if (biz) {
                io.to(`business_${bizId}`).emit("businessStatusUpdate", {
                  businessId: bizId,
                  activeVisitors: Math.max(0, (biz.activeVisitors || 1) - 1),
                  isOwnerOnline: biz.isOwnerOnline,
                });
              }
            })
            .catch(err => logger.error({ err }, "[Socket] Error cleaning up business visitor on disconnect"));
        }
      }


      if (disconnectedUserId && regularUserCompletelyOffline) {
        Business.updateMany(
          { ownerId: disconnectedUserId },
          { $set: { isOwnerOnline: false } }
        ).then(async () => {
          const businesses = await Business.find({ ownerId: disconnectedUserId }, "_id activeVisitors");
          businesses.forEach(biz => {
            io.to(`business_${biz._id}`).emit("businessStatusUpdate", {
              businessId: biz._id.toString(),
              activeVisitors: biz.activeVisitors || 0,
              isOwnerOnline: false,
            });
          });
        }).catch(err => logger.error({ err }, "[Socket] Error updating business offline status"));
      }
    });
  });

  const recordOnlineStats = async () => {
    try {
      const regularUsers = Array.from(onlineUsers.entries()).filter(
        ([_, u]) => !u.isAdmin && u.socketIds.size > 0,
      );
      const count = regularUsers.length;

      await OnlineStatus.create({ count });

      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await OnlineStatus.deleteMany({ timestamp: { $lt: fortyEightHoursAgo } });
    } catch (err) {
      logger.error({ err }, "[Socket] Error recording online stats");
    }
  };

  setInterval(recordOnlineStats, 15 * 60 * 1000);
  setTimeout(recordOnlineStats, 5000);

  return io;
};

module.exports = initSocket;
