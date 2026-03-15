const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

// @desc    Subscribe to push notifications
// @route   POST /api/push/subscribe
// @access  Private
router.post("/subscribe", auth, async (req, res) => {
  try {
    const { subscription, deviceType } = req.body;
    const user = await User.findById(req.user.id); // req.user has id from authMiddleware

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if subscription already exists
    const exists = user.pushSubscriptions.find(s => s.endpoint === subscription.endpoint);
    
    if (!exists) {
      user.pushSubscriptions.push({
        ...subscription,
        deviceType: deviceType || "unknown",
      });
      await user.save();
    }

    res.status(201).json({ message: "Subscribed successfully" });
  } catch (error) {
    console.error("Error subscribing to push:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Unsubscribe from push notifications
// @route   POST /api/push/unsubscribe
// @access  Private
router.post("/unsubscribe", auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== endpoint);
    await user.save();

    res.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Error unsubscribing from push:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Toggle notifications preference
// @route   PUT /api/push/toggle
// @access  Private
router.put("/toggle", auth, async (req, res) => {
  try {
    const { notificationsEnabled } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.notificationsEnabled = notificationsEnabled;
    await user.save();

    res.json({ message: `Notifications ${notificationsEnabled ? "enabled" : "disabled"}` });
  } catch (error) {
    console.error("Error toggling notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
