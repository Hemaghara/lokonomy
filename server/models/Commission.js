const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderAmount: {
    type: Number,
    required: true,
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  commissionAmount: {
    type: Number,
    required: true,
  },
  sellerPayout: {
    type: Number,
    required: true,
  },
  sellerPlan: {
    type: String,
    enum: ["free", "silver", "gold", "platinum"],
    default: "free",
  },
  status: {
    type: String,
    enum: ["pending", "collected", "paid"],
    default: "pending",
  },
  paidAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

commissionSchema.index({ sellerId: 1, createdAt: -1 });
commissionSchema.index({ status: 1 });

module.exports = mongoose.model("Commission", commissionSchema);
