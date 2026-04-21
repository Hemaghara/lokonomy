const express = require("express");
const router = express.Router();
const chatCtrl = require("../../controllers/adminChatController");
const reportCtrl = require("../../controllers/adminReportingController");
const healthCtrl = require("../../controllers/adminHealthController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/health", protectAdmin, healthCtrl.getSystemHealth);
router.get("/chats/stats", protectAdmin, chatCtrl.getChatStats);
router.get("/chats/reported", protectAdmin, chatCtrl.getReportedChats);
router.get(
  "/chats/conversation/:chatRoom",
  protectAdmin,
  chatCtrl.getConversation,
);
router.get("/reports/export/:type", protectAdmin, reportCtrl.exportData);

module.exports = router;
