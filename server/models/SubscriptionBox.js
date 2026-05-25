const mongoose = require("mongoose");

const subscriptionBoxSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  frequency: { type: String, enum: ["weekly", "monthly"], default: "monthly" },
  items: [{ type: String }],
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SubscriptionBox", subscriptionBoxSchema);
