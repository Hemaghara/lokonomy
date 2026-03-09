const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  content: {
    type: String,
    required: [true, "Content is required"],
  },
  type: {
    type: String,
    required: [true, "Story type is required"],
    enum: ["News", "Offers", "Promotions", "Events", "Announcements", "Tips"],
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
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
});

storySchema.index({ location: "2dsphere" });

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Story", storySchema);
