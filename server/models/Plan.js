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
      productsUpload: { type: Number, default: 0 },
      storiesPost: { type: Number, default: 0 },
      jobsPost: { type: Number, default: 0 },
      analytics: { type: Boolean, default: false },
      featuredListings: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      chatMessaging: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Plan", planSchema);
