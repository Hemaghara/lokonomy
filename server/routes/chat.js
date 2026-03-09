const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getMessages,
  getUserChats,
  getUnreadCount,
  markAsRead,
} = require("../controllers/chatController");

router.get("/messages/:productId/:buyerId/:sellerId", auth, getMessages);
router.get("/conversations", auth, getUserChats);
router.get("/unread", auth, getUnreadCount);
router.patch("/read/:chatRoom", auth, markAsRead);

module.exports = router;
