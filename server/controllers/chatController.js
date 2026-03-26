const Message = require("../models/Message");
const Business = require("../models/Business");
const User = require("../models/User");
const mongoose = require("mongoose");

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
    console.error("Error fetching messages:", err);
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
    console.error("Error fetching business messages:", err);
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
            { receiverId: userId }
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
        // Convert string IDs to ObjectIds if possible for lookups
        $addFields: {
          productIdObj: { 
            $cond: [
              { $eq: ["$productId", null] }, 
              null, 
              { $convert: { input: "$productId", to: "objectId", onError: null, onNull: null } }
            ]
          },
          businessIdObj: { 
            $cond: [
              { $eq: ["$businessId", null] }, 
              null, 
              { $convert: { input: "$businessId", to: "objectId", onError: null, onNull: null } }
            ]
          }
        }
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

    const chatsWithDetails = await Promise.all(
      chatRooms.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatRoom: chat._id,
          receiverId: userObjectId,
          read: false,
        });

        const allParticipantIds = [
          ...chat.allSenderIds.map((id) => id.toString()),
          ...chat.allReceiverIds.map((id) => id.toString()),
        ];
        const uniqueIds = [...new Set(allParticipantIds)];
        const otherUserId = uniqueIds.find((id) => id !== userId) || null;

        let otherUserName = "User";
        const senderEntry = chat.allSenderNames.find(
          (entry) => entry.id && entry.id.toString() === otherUserId,
        );
        
        if (senderEntry) {
          otherUserName = senderEntry.name;
        } else if (otherUserId) {
          try {
             const fallbackUser = await User.findById(otherUserId).select("name");
             if (fallbackUser) otherUserName = fallbackUser.name;
          } catch (e) {}
        }

        const chatType = chat.chatType || "product";

        if (chatType === "business_inquiry") {
          const isOwner =
            chat.business?.ownerId?.toString() === userId ||
            chat.business?.ownerId === userId;
          
          const displayOtherName = (!isOwner && chat.business?.businessName) 
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

        // Product chat
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
      }),
    );

    res.json({ success: true, chats: chatsWithDetails });
  } catch (err) {
    console.error("Error fetching user chats:", err);
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
    console.error("Error fetching unread count:", err);
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
    console.error("Error marking messages as read:", err);
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
