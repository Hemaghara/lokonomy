const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["one_time", "recurring"],
      default: "one_time",
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "running", "completed", "cancelled"],
      default: "draft",
    },
    segment: {
      districts: [String],
      plans: [{ type: String, enum: ["free", "silver", "gold", "platinum"] }],
      lastLoginBefore: { type: Date, default: null },
      lastLoginAfter: { type: Date, default: null },
      minLoyaltyPoints: { type: Number, default: null },
      maxLoyaltyPoints: { type: Number, default: null },
    },

    notification: {
      title: { type: String, required: true },
      body: { type: String, required: true },
      imageUrl: { type: String, default: null },
      actionUrl: { type: String, default: null },
    },

    scheduledAt: { type: Date, default: null },
    recurringCron: { type: String, default: null },
    stats: {
      targetedCount: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      openedCount: { type: Number, default: 0 },
      clickedCount: { type: Number, default: 0 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Campaign", campaignSchema);
