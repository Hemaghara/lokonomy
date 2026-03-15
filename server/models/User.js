const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    default: null,
  },
  taluka: {
    type: String,
    default: null,
  },
  // coordinates: [longitude, latitude] (GeoJSON order)
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  locationName: { type: String, default: null },
  locationPermission: {
    type: String,
    enum: ["granted", "denied", "not_asked"],
    default: "not_asked",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  otp: { type: String },
  otpExpires: { type: Date },
  upiId: { type: String, default: null },
  paymentQrCode: { type: String, default: null },
  bankName: { type: String, default: null },
  ifscCode: { type: String, default: null },
  branch: { type: String, default: null },
  accountNumber: { type: String, default: null },
  phoneNumber: { type: String, default: null },
  subscription: {
    plan: {
      type: String,
      enum: ["free", "silver", "gold", "platinum"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "expired", "none"],
      default: "none",
    },
    startDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    durationMonths: { type: Number, default: null },
  },
  usage: {
    productsUploaded: { type: Number, default: 0 },
    storiesPosted: { type: Number, default: 0 },
    jobsPosted: { type: Number, default: 0 },
  },
  savedJobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
  ],
  savedProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  savedBusinesses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
    },
  ],
  pushSubscriptions: [
    {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String,
      },
      deviceType: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  notificationsEnabled: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("User", userSchema);
