const User = require("../models/User");
const logger = require("../utils/logger");

exports.subscribe = async (req, res) => {
  try {
    const { subscription, deviceType } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const exists = user.pushSubscriptions.find(
      (s) => s.endpoint === subscription.endpoint,
    );

    if (!exists) {
      user.pushSubscriptions.push({
        ...subscription,
        deviceType: deviceType || "unknown",
      });
      await user.save();
    }

    logger.info(
      { userId: req.user.id, deviceType },
      "User subscribed to push notifications",
    );
    res.status(201).json({ message: "Subscribed successfully" });
  } catch (error) {
    logger.error(
      { err: error, userId: req.user.id },
      "Error subscribing to push",
    );
    res.status(500).json({ message: "Server error" });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.pushSubscriptions = user.pushSubscriptions.filter(
      (s) => s.endpoint !== endpoint,
    );
    await user.save();

    logger.info(
      { userId: req.user.id },
      "User unsubscribed from push notifications",
    );
    res.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    logger.error(
      { err: error, userId: req.user.id },
      "Error unsubscribing from push",
    );
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleNotifications = async (req, res) => {
  try {
    const { notificationsEnabled } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.notificationsEnabled = notificationsEnabled;
    await user.save();

    logger.info(
      { userId: req.user.id, enabled: notificationsEnabled },
      "Push notifications status toggled",
    );
    res.json({
      message: `Notifications ${notificationsEnabled ? "enabled" : "disabled"}`,
    });
  } catch (error) {
    logger.error(
      { err: error, userId: req.user.id },
      "Error toggling notifications",
    );
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleReminders = async (req, res) => {
  try {
    const { enabled } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.appointmentRemindersEnabled = enabled;
    await user.save();

    logger.info(
      { userId: req.user.id, enabled },
      "Appointment reminders status toggled",
    );
    res.json({
      message: `Appointment reminders ${enabled ? "enabled" : "disabled"}`,
      enabled: user.appointmentRemindersEnabled,
    });
  } catch (error) {
    logger.error(
      { err: error, userId: req.user.id },
      "Error toggling reminders",
    );
    res.status(500).json({ message: "Server error" });
  }
};
