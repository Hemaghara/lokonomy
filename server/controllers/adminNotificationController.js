const User = require("../models/User");
const Notification = require("../models/Notification");
const ScheduledNotification = require("../models/ScheduledNotification");
const { sendPushNotification } = require("../utils/pushService");
const logger = require("../utils/logger");

exports.sendToAllUsers = async (req, res) => {
  try {
    const { title, message, actionUrl } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({ message: "Title and message are required" });
    }

    const users = await User.find({ status: "active" }, "_id");

    const notificationPromises = users.map(async (user) => {
      const newNotification = new Notification({
        recipient: user._id,
        type: "system",
        title,
        message,
        actionUrl: actionUrl || null,
        metadata: { adminSent: true },
      });
      await newNotification.save();

      await sendPushNotification(user._id, {
        title,
        body: message,
        data: { url: actionUrl || "/" },
      });
    });

    await Promise.all(notificationPromises);

    res.json({
      message: `Notification sent to ${users.length} users successfully`,
    });
  } catch (error) {
    logger.error({ err: error }, "Error sending notification to all");
    res.status(500).json({ message: "Server error" });
  }
};
exports.sendByPlan = async (req, res) => {
  try {
    const { plan, title, message, actionUrl } = req.body;

    if (!plan || !title || !message) {
      return res
        .status(400)
        .json({ message: "Plan, title, and message are required" });
    }

    const users = await User.find(
      {
        "subscription.plan": plan,
        "subscription.status": "active",
        status: "active",
      },
      "_id",
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: `No active users found for plan: ${plan}` });
    }

    const notificationPromises = users.map(async (user) => {
      const newNotification = new Notification({
        recipient: user._id,
        type: "system",
        title,
        message,
        actionUrl: actionUrl || null,
        metadata: { adminSent: true, targetPlan: plan },
      });
      await newNotification.save();

      await sendPushNotification(user._id, {
        title,
        body: message,
        data: { url: actionUrl || "/subscriptions" },
      });
    });

    await Promise.all(notificationPromises);

    res.json({
      message: `Notification sent to ${users.length} ${plan} users successfully`,
    });
  } catch (error) {
    logger.error({ err: error }, "Error sending notification by plan");
    res.status(500).json({ message: "Server error" });
  }
};

exports.getNotificationHistory = async (req, res) => {
  try {
    const history = await Notification.aggregate([
      { $match: { "metadata.adminSent": true } },
      {
        $group: {
          _id: { title: "$title", message: "$message" },
          sentAt: { $max: "$createdAt" },
          recipientCount: { $sum: 1 },
          type: { $first: "$type" },
          targetPlan: { $first: "$metadata.targetPlan" },
        },
      },
      { $sort: { sentAt: -1 } },
      { $limit: 20 },
    ]);

    res.json(
      history.map((h) => ({
        title: h._id.title,
        message: h._id.message,
        sentAt: h.sentAt,
        recipientCount: h.recipientCount,
        targetPlan: h.targetPlan || "All Users",
      })),
    );
  } catch (error) {
    logger.error({ err: error }, "Error fetching history");
    res.status(500).json({ message: "Server error" });
  }
};

exports.scheduleNotification = async (req, res) => {
  try {
    const { title, message, actionUrl, target, targetPlan, scheduledFor } = req.body;

    if (!title || !message || !target || !scheduledFor) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const newSchedule = new ScheduledNotification({
      title,
      message,
      actionUrl,
      target,
      targetPlan: target === "plan" ? targetPlan : null,
      scheduledFor: new Date(scheduledFor),
    });

    await newSchedule.save();

    res.json({
      message: "Notification scheduled successfully",
      schedule: newSchedule,
    });
  } catch (error) {
    logger.error({ err: error }, "Error scheduling notification");
    res.status(500).json({ message: "Server error" });
  }
};

exports.getScheduledNotifications = async (req, res) => {
  try {
    const scheduled = await ScheduledNotification.find({ status: "pending" }).sort({
      scheduledFor: 1,
    });
    res.json(scheduled);
  } catch (error) {
    logger.error({ err: error }, "Error fetching scheduled notifications");
    res.status(500).json({ message: "Server error" });
  }
};

exports.cancelScheduledNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ScheduledNotification.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Scheduled notification not found" });
    }
    res.json({ message: "Scheduled notification cancelled successfully" });
  } catch (error) {
    logger.error({ err: error }, "Error cancelling scheduled notification");
    res.status(500).json({ message: "Server error" });
  }
};
