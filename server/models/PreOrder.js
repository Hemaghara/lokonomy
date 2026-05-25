const mongoose = require("mongoose");

const preOrderSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
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
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  pickupDate: {
    type: Date,
    required: true,
  },
  pickupTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "completed", "cancelled", "rejected"],
    default: "pending",
  },
  notes: {
    type: String,
    default: "",
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  depositPaid: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

preOrderSchema.index({ sellerId: 1, status: 1 });
preOrderSchema.index({ buyerId: 1 });

module.exports = mongoose.model("PreOrder", preOrderSchema);
