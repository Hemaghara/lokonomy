const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  date: {
    type: String, 
    required: true,
  },
  timeSlot: {
    type: String, 
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  message: {
    type: String,
  },
  isOwnerSelf: {
    type: Boolean,
    default: false,
  },
  couponApplied: {
    code: { type: String },
    discount: { type: Number },
    discountType: { type: String, enum: ["percentage", "fixed"] },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


bookingSchema.index({ businessId: 1, date: 1, timeSlot: 1 }, { unique: false });

module.exports = mongoose.model("Booking", bookingSchema);
