const Notification = require("../models/Notification");
const logger = require("../utils/logger");

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const filter = { recipient: req.user.id };
    if (type && type !== "all") filter.type = type;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      notifications,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getNotifications");
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });
    res.json({ success: true, count });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getUnreadCount");
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true },
    );
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true, notification });
  } catch (err) {
    logger.error({ err, notificationId: req.params.id, userId: req.user.id }, "Error in markAsRead");
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true },
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in markAllAsRead");
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in clearAll notifications");
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createNotification = async ({
  recipientId,
  type,
  title,
  message,
  actionUrl,
  metadata,
  io,
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      actionUrl: actionUrl || null,
      metadata: metadata || {},
    });

    if (io) {
      io.to(`user_${recipientId}`).emit("newNotification", notification);
    }

    logger.info({ recipientId, type, title }, "Internal notification created");
    return notification;
  } catch (err) {
    logger.error({ err, recipientId, type }, "Error in createNotification helper");
    return null;
  }
};
