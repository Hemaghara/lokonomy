const express = require("express");
const router = express.Router();
const { protectAdmin } = require("../../middleware/adminMiddleware");
const { 
  sendToAllUsers, 
  sendByPlan, 
  getNotificationHistory,
  scheduleNotification,
  getScheduledNotifications,
  cancelScheduledNotification
} = require("../../controllers/adminNotificationController");

router.use(protectAdmin);
router.post("/send-all", sendToAllUsers);
router.post("/send-by-plan", sendByPlan);
router.get("/history", getNotificationHistory);
router.post("/schedule", scheduleNotification);
router.get("/scheduled", getScheduledNotifications);
router.delete("/scheduled/:id", cancelScheduledNotification);

module.exports = router;
