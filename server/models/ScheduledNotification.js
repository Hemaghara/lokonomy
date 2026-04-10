const mongoose = require("mongoose");

const scheduledNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    actionUrl: {
      type: String,
      default: null,
    },
    target: {
      type: String,
      enum: ["all", "plan"],
      required: true,
    },
    targetPlan: {
      type: String,
      default: null, // if target is 'plan'
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    sentAt: {
      type: Date,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScheduledNotification", scheduledNotificationSchema);
