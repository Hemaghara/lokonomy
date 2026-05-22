const mongoose = require("mongoose");

const feedSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [100, "Title must be under 100 characters"],
  },
  content: {
    type: String,
    required: [true, "Content is required"],
    maxlength: [5000, "Content must be under 5000 characters"],
  },
  type: {
    type: String,
    required: [true, "Feed type is required"],
    enum: ["Sale", "Offer", "Information", "New Arrival", "Exhibition", "Event"],
  },
  eventDate: {
    type: String,
  },
  eventTime: {
    type: String,
  },
  image: {
    type: String,
  },
  district: {
    type: String,
  },
  taluka: {
    type: String,
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [72.6, 22.3] },
  },
  locationAddress: {
    type: String,
  },
  author: {
    type: String,
    required: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  scheduledAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  isPinned: { type: Boolean, default: false },
  pinnedAt: { type: Date, default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  commentCount: { type: Number, default: 0 },
  // New fields for enhanced features
  viewCount: { type: Number, default: 0 },
  tags: [{ type: String, trim: true, lowercase: true }],
  status: {
    type: String,
    enum: ["active", "pending", "flagged"],
    default: "active",
  },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
});

feedSchema.index({ location: "2dsphere" });
feedSchema.index({ title: "text", content: "text" });
feedSchema.index({ status: 1, createdAt: -1 });
feedSchema.index({ authorId: 1 });

module.exports = mongoose.model("Feed", feedSchema);
