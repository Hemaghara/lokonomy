const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    prices: {
      3: { type: Number, required: true },
      6: { type: Number, required: true },
      12: { type: Number, required: true },
    },
    limits: {
      productsUploaded: { type: Number, default: 0 },
      storiesPosted: { type: Number, default: 0 },
      jobsPosted: { type: Number, default: 0 },
      analytics: { type: Boolean, default: false },
      featuredListings: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      chatMessaging: { type: Boolean, default: true },
      couponsPerMonth: { type: Number, default: 0 },
      bookingEnabled: { type: Boolean, default: false },
      customUrl: { type: Boolean, default: false },
      removeBranding: { type: Boolean, default: false },
      aiInsights: { type: String, enum: ["none", "basic", "advanced"], default: "none" },
      autoResponder: { type: Boolean, default: false },
      promotedListings: { type: Boolean, default: false },
      guaranteeBadge: { type: Boolean, default: false },
      commissionRate: { type: Number, default: 5 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Plan", planSchema);
