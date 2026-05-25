const mongoose = require("mongoose");

const promotedListingSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["search_boost", "featured_badge", "story_boost"],
    required: true,
  },
  budget: {
    type: Number,
    required: true,
    min: 0,
  },
  spent: {
    type: Number,
    default: 0,
    min: 0,
  },
  impressions: {
    type: Number,
    default: 0,
    min: 0,
  },
  clicks: {
    type: Number,
    default: 0,
    min: 0,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "paused", "completed", "draft"],
    default: "active",
  },
  paymentId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

promotedListingSchema.index({ businessId: 1 });
promotedListingSchema.index({ status: 1, type: 1 });

module.exports = mongoose.model("PromotedListing", promotedListingSchema);
