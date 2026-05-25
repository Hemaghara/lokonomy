const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  orderStatus: {
    type: String,
    enum: [
      "pending",
      "preparing",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["bank_transfer", "atm_card", "upi", "net_banking"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  shippingAddress: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  commissionRate: {
    type: Number,
    default: 0,
  },
  commissionAmount: {
    type: Number,
    default: 0,
  },
  sellerPayout: {
    type: Number,
    default: 0,
  },
  tracking: {
    currentLocation: {
      lat: { type: Number, default: 23.0225 },
      lng: { type: Number, default: 72.5714 },
    },
    estimatedDelivery: { type: Date },
    status: { type: String, default: "pending" },
    updates: [
      {
        status: { type: String },
        location: { type: String },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
