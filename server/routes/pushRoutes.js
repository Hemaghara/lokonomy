const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  subscribe,
  unsubscribe,
  toggleNotifications,
  toggleReminders,
} = require("../controllers/pushController");

router.post("/subscribe", auth, subscribe);
router.post("/unsubscribe", auth, unsubscribe);
router.put("/toggle", auth, toggleNotifications);
router.put("/toggle-reminders", auth, toggleReminders);

module.exports = router;
