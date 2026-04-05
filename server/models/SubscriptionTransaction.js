const mongoose = require("mongoose");

const subscriptionTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  plan: {
    type: String,
    enum: ["silver", "gold", "platinum"],
    required: true,
  },
  durationMonths: {
    type: Number,
    enum: [3, 6, 12],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "INR",
  },
  status: {
    type: String,
    enum: ["success", "failed", "pending", "refunded"],
    default: "pending",
  },
  razorpayOrderId: {
    type: String,
    default: null,
  },
  razorpayPaymentId: {
    type: String,
    default: null,
  },
  failureReason: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

subscriptionTransactionSchema.index({ plan: 1, status: 1 });
subscriptionTransactionSchema.index({ createdAt: -1 });
subscriptionTransactionSchema.index({ status: 1 });

module.exports = mongoose.model("SubscriptionTransaction", subscriptionTransactionSchema);
