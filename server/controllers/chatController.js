const Message = require("../models/Message");
const Business = require("../models/Business");
const User = require("../models/User");
const mongoose = require("mongoose");
const logger = require("../utils/logger");

const generateChatRoom = (productId, buyerId, sellerId) => {
  const ids = [buyerId, sellerId].sort();
  return `${productId}_${ids[0]}_${ids[1]}`;
};

const generateBusinessChatRoom = (businessId, userId, ownerId) => {
  const ids = [userId, ownerId].sort();
  return `biz_${businessId}_${ids[0]}_${ids[1]}`;
};

const getMessages = async (req, res) => {
  try {
    const { productId, buyerId, sellerId } = req.params;
    const chatRoom = generateChatRoom(productId, buyerId, sellerId);

    const messages = await Message.find({ chatRoom })
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({ success: true, messages });
  } catch (err) {
    logger.error({ err, params: req.params }, "Error fetching messages");
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getBusinessMessages = async (req, res) => {
  try {
    const { businessId, userId, ownerId } = req.params;
    const chatRoom = generateBusinessChatRoom(businessId, userId, ownerId);

    const messages = await Message.find({ chatRoom })
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({ success: true, messages });
  } catch (err) {
    logger.error(
      { err, params: req.params },
      "Error fetching business messages",
    );
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (e) {
      userObjectId = userId;
    }

    const chatRooms = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userObjectId },
            { receiverId: userObjectId },
            { senderId: userId },
            { receiverId: userId },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$chatRoom",
          lastMessage: { $first: "$message" },
          lastMessageAt: { $first: "$createdAt" },
          lastSenderId: { $first: "$senderId" },
          lastSenderName: { $first: "$senderName" },
          productId: { $first: "$productId" },
          businessId: { $first: "$businessId" },
          chatType: { $first: "$chatType" },
          allSenderIds: { $addToSet: "$senderId" },
          allReceiverIds: { $addToSet: "$receiverId" },
          allSenderNames: {
            $addToSet: { id: "$senderId", name: "$senderName" },
          },
        },
      },
      {
        $addFields: {
          productIdObj: {
            $cond: [
              { $eq: ["$productId", null] },
              null,
              {
                $convert: {
                  input: "$productId",
                  to: "objectId",
                  onError: null,
                  onNull: null,
                },
              },
            ],
          },
          businessIdObj: {
            $cond: [
              { $eq: ["$businessId", null] },
              null,
              {
                $convert: {
                  input: "$businessId",
                  to: "objectId",
                  onError: null,
                  onNull: null,
                },
              },
            ],
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      {
        $lookup: {
          from: "products",
          localField: "productIdObj",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "product.sellerId",
          foreignField: "_id",
          as: "sellerUser",
        },
      },
      { $unwind: { path: "$sellerUser", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "businesses",
          localField: "businessIdObj",
          foreignField: "_id",
          as: "business",
        },
      },
      { $unwind: { path: "$business", preserveNullAndEmptyArrays: true } },
    ]);

    const chatRoomIds = chatRooms.map((c) => c._id);
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          chatRoom: { $in: chatRoomIds },
          receiverId: userObjectId,
          read: false,
        },
      },
      { $group: { _id: "$chatRoom", count: { $sum: 1 } } },
    ]);

    const unreadCountMap = Object.fromEntries(
      unreadCounts.map((c) => [c._id, c.count]),
    );

    const allParticipantIds = new Set();
    chatRooms.forEach((chat) => {
      chat.allSenderIds.forEach((id) => allParticipantIds.add(id.toString()));
      chat.allReceiverIds.forEach((id) => allParticipantIds.add(id.toString()));
    });

    const otherUserIds = [...allParticipantIds].filter((id) => id !== userId);
    const users = await User.find({ _id: { $in: otherUserIds } }).select(
      "name",
    );
    const userMap = Object.fromEntries(
      users.map((u) => [u._id.toString(), u.name]),
    );

    const chatsWithDetails = chatRooms.map((chat) => {
      const unreadCount = unreadCountMap[chat._id] || 0;

      const chatParticipantIds = [
        ...chat.allSenderIds.map((id) => id.toString()),
        ...chat.allReceiverIds.map((id) => id.toString()),
      ];
      const uniqueIds = [...new Set(chatParticipantIds)];
      const otherUserId = uniqueIds.find((id) => id !== userId) || null;

      let otherUserName = "User";
      const senderEntry = chat.allSenderNames.find(
        (entry) => entry.id && entry.id.toString() === otherUserId,
      );

      if (senderEntry) {
        otherUserName = senderEntry.name;
      } else if (otherUserId && userMap[otherUserId]) {
        otherUserName = userMap[otherUserId];
      }

      const chatType = chat.chatType || "product";

      if (chatType === "business_inquiry") {
        const isOwner =
          chat.business?.ownerId?.toString() === userId ||
          chat.business?.ownerId === userId;

        const displayOtherName =
          !isOwner && chat.business?.businessName
            ? chat.business.businessName
            : otherUserName;

        return {
          ...chat,
          chatType: "business_inquiry",
          unreadCount,
          otherUserName: displayOtherName,
          otherUserId,
          isOwner,
          buyerId: isOwner ? otherUserId : userId,
          sellerId: chat.business?.ownerId?.toString(),
        };
      }

      const isSeller = chat.product?.sellerId?.toString() === userId;
      const chatRoomParts = chat._id.split("_");
      const sellerIdFromProduct = chat.product?.sellerId?.toString();
      const participantId1 = chatRoomParts[1];
      const participantId2 = chatRoomParts[2];
      const buyerIdFromRoom =
        participantId1 === sellerIdFromProduct
          ? participantId2
          : participantId1;

      return {
        ...chat,
        chatType: "product",
        unreadCount,
        otherUserName,
        otherUserId,
        isSeller,
        buyerId: buyerIdFromRoom,
        sellerId: sellerIdFromProduct || otherUserId,
        sellerName:
          chat.product?.sellerProfile?.name ||
          chat.sellerUser?.name ||
          "Seller",
      };
    });

    res.json({ success: true, chats: chatsWithDetails });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error fetching user chats");
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Message.countDocuments({
      receiverId: new mongoose.Types.ObjectId(userId),
      read: false,
    });
    res.json({ success: true, count });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error fetching unread count");
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { chatRoom } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      {
        chatRoom,
        receiverId: new mongoose.Types.ObjectId(userId),
        read: false,
      },
      { $set: { read: true } },
    );

    res.json({ success: true });
  } catch (err) {
    logger.error(
      { err, chatRoom: req.params.chatRoom, userId: req.user.id },
      "Error marking messages as read",
    );
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getMessages,
  getBusinessMessages,
  getUserChats,
  getUnreadCount,
  markAsRead,
  generateChatRoom,
  generateBusinessChatRoom,
};
