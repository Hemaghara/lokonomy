const { Server } = require("socket.io");
const Message = require("./models/Message");
const Business = require("./models/Business");
const OnlineStatus = require("./models/OnlineStatus");
const { createNotification } = require("./controllers/notificationController");
const logger = require("./utils/logger");
const { sendMessageSchema } = require("./validators/chat.schema");
const { ZodError } = require("zod");
const jwt = require("jsonwebtoken");

const allowedOrigins = require("./config/corsOrigins");

const businessVisitors = new Map();

const getActiveBusinessVisitors = (businessId) => {
  const bizIdStr = businessId.toString();
  return businessVisitors.has(bizIdStr) ? businessVisitors.get(bizIdStr).size : 0;
};

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("CORS policy violation"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });


  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.user?.id || decoded.id;
      socket.isAdmin = false;
      return next();
    } catch (err) {
      try {
        const decodedAdmin = jwt.verify(token, process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET);
        socket.userId = decodedAdmin.id;
        socket.isAdmin = true;
        return next();
      } catch (err2) {
        return next(new Error("Invalid token"));
      }
    }
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


  const cleanupOrphanedUsers = () => {
    logger.debug("[Socket] Running cleanup of orphaned onlineUsers");
    let changed = false;
    for (const [userId, data] of onlineUsers.entries()) {
      if (!data.socketIds || data.socketIds.size === 0) {
        onlineUsers.delete(userId);
        changed = true;
      } else {
        for (const socketId of data.socketIds) {
          if (!io.sockets.sockets.has(socketId)) {
            data.socketIds.delete(socketId);
            if (data.socketIds.size === 0) {
              onlineUsers.delete(userId);
              changed = true;
            }
          }
        }
      }
    }
    if (changed) {
      emitOnlineCount();
    }
  };

  io.on("connection", (socket) => {
    logger.debug({ socketId: socket.id }, "[Socket] New raw connection");

    const currentCount = Array.from(onlineUsers.values()).filter(
      (u) => !u.isAdmin && u.socketIds.size > 0,
    ).length;
    socket.emit("onlineUsersCount", currentCount);

    socket.on("registerUser", (data) => {

      const userId = socket.userId;
      const isAdmin = socket.isAdmin;

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
          const businesses = await Business.find({ ownerId: userId }, "_id");
          businesses.forEach(biz => {
            io.to(`business_${biz._id}`).emit("businessStatusUpdate", {
              businessId: biz._id.toString(),
              activeVisitors: getActiveBusinessVisitors(biz._id),
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
        const bizIdStr = businessId.toString();
        
        if (!businessVisitors.has(bizIdStr)) {
          businessVisitors.set(bizIdStr, new Set());
        }
        businessVisitors.get(bizIdStr).add(socket.id);

        Business.findById(businessId).select("isOwnerOnline")
          .then(biz => {
            if (biz) {
              io.to(`business_${businessId}`).emit("businessStatusUpdate", {
                businessId,
                activeVisitors: getActiveBusinessVisitors(businessId),
                isOwnerOnline: biz.isOwnerOnline,
              });
            }
          })
          .catch(err => logger.error({ err }, "[Socket] Error tracking business visitor"));

        if (!socket._visitingBusinesses) socket._visitingBusinesses = new Set();
        socket._visitingBusinesses.add(bizIdStr);
        logger.debug({ socketId: socket.id, businessId }, "[Socket] Joined business page");
      }
    });

    socket.on("leaveBusinessPage", ({ businessId }) => {
      if (businessId) {
        socket.leave(`business_${businessId}`);
        const bizIdStr = businessId.toString();

        if (businessVisitors.has(bizIdStr)) {
          businessVisitors.get(bizIdStr).delete(socket.id);
          if (businessVisitors.get(bizIdStr).size === 0) {
            businessVisitors.delete(bizIdStr);
          }
        }

        Business.findById(businessId).select("isOwnerOnline")
          .then(biz => {
            if (biz) {
              io.to(`business_${businessId}`).emit("businessStatusUpdate", {
                businessId,
                activeVisitors: getActiveBusinessVisitors(businessId),
                isOwnerOnline: biz.isOwnerOnline,
              });
            }
          })
          .catch(err => logger.error({ err }, "[Socket] Error tracking business visitor leave"));

        if (socket._visitingBusinesses) socket._visitingBusinesses.delete(bizIdStr);
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
        const validatedData = await sendMessageSchema.body.parseAsync(data);
        
        const {
          chatRoom,
          productId,
          businessId,
          chatType,
          receiverId,
          senderName,
          message,
        } = data;

        const senderId = socket.userId;

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
        if (err instanceof ZodError) {
          logger.warn({ err: err.errors }, "[Socket] Validation error on sendMessage");
          return socket.emit("messageError", { error: err.errors[0].message });
        }
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
          if (businessVisitors.has(bizId)) {
            businessVisitors.get(bizId).delete(socket.id);
            if (businessVisitors.get(bizId).size === 0) {
              businessVisitors.delete(bizId);
            }
          }

          Business.findById(bizId).select("isOwnerOnline")
            .then(biz => {
              if (biz) {
                io.to(`business_${bizId}`).emit("businessStatusUpdate", {
                  businessId: bizId,
                  activeVisitors: getActiveBusinessVisitors(bizId),
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
          const businesses = await Business.find({ ownerId: disconnectedUserId }, "_id");
          businesses.forEach(biz => {
            io.to(`business_${biz._id}`).emit("businessStatusUpdate", {
              businessId: biz._id.toString(),
              activeVisitors: getActiveBusinessVisitors(biz._id),
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

  const recordStatsInterval = setInterval(recordOnlineStats, 15 * 60 * 1000);
  const cleanupInterval = setInterval(cleanupOrphanedUsers, 5 * 60 * 1000);
  const initialStatsTimeout = setTimeout(recordOnlineStats, 5000);

  io.closeOriginal = io.close;
  io.close = function (cb) {
    clearInterval(recordStatsInterval);
    clearInterval(cleanupInterval);
    clearTimeout(initialStatsTimeout);
    return io.closeOriginal(cb);
  };

  return io;
};

module.exports = { initSocket, getActiveBusinessVisitors };
