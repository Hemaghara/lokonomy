const express = require("express");
const router = express.Router();
const { protectAdmin } = require("../../middleware/adminMiddleware");
const { 
  sendToAllUsers, 
  sendByPlan, 
  getNotificationHistory 
} = require("../../controllers/adminNotificationController");

router.use(protectAdmin);
router.post("/send-all", sendToAllUsers);
router.post("/send-by-plan", sendByPlan);
router.get("/history", getNotificationHistory);

module.exports = router;
