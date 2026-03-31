const User = require("../models/User");

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

    res.status(201).json({ message: "Subscribed successfully" });
  } catch (error) {
    console.error("Error subscribing to push:", error);
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

    res.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Error unsubscribing from push:", error);
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

    res.json({
      message: `Notifications ${notificationsEnabled ? "enabled" : "disabled"}`,
    });
  } catch (error) {
    console.error("Error toggling notifications:", error);
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

    res.json({
      message: `Appointment reminders ${enabled ? "enabled" : "disabled"}`,
      enabled: user.appointmentRemindersEnabled,
    });
  } catch (error) {
    console.error("Error toggling reminders:", error);
    res.status(500).json({ message: "Server error" });
  }
};
