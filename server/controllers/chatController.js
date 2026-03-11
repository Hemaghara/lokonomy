const Message = require("../models/Message");
const mongoose = require("mongoose");

const generateChatRoom = (productId, buyerId, sellerId) => {
  const ids = [buyerId, sellerId].sort();
  return `${productId}_${ids[0]}_${ids[1]}`;
};

const getMessages = async (req, res) => {
  try {
    const { productId, buyerId, sellerId } = req.params;
    const chatRoom = generateChatRoom(productId, buyerId, sellerId);
    console.log(`Chat room: ${chatRoom}`);

    const messages = await Message.find({ chatRoom })
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({ success: true, messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`User ID: ${userId}`);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log(`User Object ID: ${userObjectId}`);

    const chatRooms = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$chatRoom",
          lastMessage: { $first: "$message" },
          lastMessageAt: { $first: "$createdAt" },
          lastSenderId: { $first: "$senderId" },
          lastSenderName: { $first: "$senderName" },
          productId: { $first: "$productId" },
          allSenderIds: { $addToSet: "$senderId" },
          allReceiverIds: { $addToSet: "$receiverId" },
          allSenderNames: {
            $addToSet: { id: "$senderId", name: "$senderName" },
          },
        },
      },
      {
        $sort: { lastMessageAt: -1 },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: { path: "$product", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "users",
          localField: "product.sellerId",
          foreignField: "_id",
          as: "sellerUser",
        },
      },
      {
        $unwind: { path: "$sellerUser", preserveNullAndEmptyArrays: true },
      },
    ]);

    const chatsWithDetails = await Promise.all(
      chatRooms.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatRoom: chat._id,
          receiverId: userObjectId,
          read: false,
        });
        console.log(`Unread count: ${unreadCount}`);

        const allParticipantIds = [
          ...chat.allSenderIds.map((id) => id.toString()),
          ...chat.allReceiverIds.map((id) => id.toString()),
        ];
        const uniqueIds = [...new Set(allParticipantIds)];
        const otherUserId = uniqueIds.find((id) => id !== userId) || null;

        let otherUserName = "User";
        const senderEntry = chat.allSenderNames.find(
          (entry) => entry.id.toString() === otherUserId,
        );
        if (senderEntry) {
          otherUserName = senderEntry.name;
        }

        const isSeller = chat.product?.sellerId?.toString() === userId;
        console.log(`Is seller: ${isSeller}`);

        const chatRoomParts = chat._id.split("_");
        const productIdFromRoom = chatRoomParts[0];
        const participantId1 = chatRoomParts[1];
        const participantId2 = chatRoomParts[2];
        const sellerIdFromProduct = chat.product?.sellerId?.toString();
        const buyerIdFromRoom =
          participantId1 === sellerIdFromProduct
            ? participantId2
            : participantId1;

        return {
          ...chat,
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
          allSenderIds: undefined,
          allReceiverIds: undefined,
          allSenderNames: undefined,
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
    console.log(`Chat room:${chatRoom}`);

    const userId = req.user.id;
    console.log(`User ID:${userId}`);

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
  getUserChats,
  getUnreadCount,
  markAsRead,
  generateChatRoom,
};
