const mongoose = require("mongoose");

const guaranteeSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
    },
    reason: {
      type: String,
      required: true,
    },
    evidence: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved_buyer", "resolved_seller", "rejected"],
      default: "pending",
    },
    resolution: {
      type: String,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Guarantee", guaranteeSchema);
