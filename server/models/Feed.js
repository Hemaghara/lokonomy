const mongoose = require("mongoose");

const feedSchema = new mongoose.Schema({
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
    required: [true, "Feed type is required"],
    enum: ["Sale", "Offer", "Information", "New Arrival", "Exhibition"],
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
});

feedSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Feed", feedSchema);
