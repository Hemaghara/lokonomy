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
  appointmentRemindersEnabled: {
    type: Boolean,
    default: true,
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    default: null,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  referralRewards: {
    totalReferrals: { type: Number, default: 0 },
    pendingDays: { type: Number, default: 0 },
    appliedDays: { type: Number, default: 0 },
    totalDiscountsGiven: { type: Number, default: 0 },
    rewardApplied: { type: Boolean, default: false },
  },
  browsingHistory: [
    {
      itemId: mongoose.Schema.Types.ObjectId,
      itemType: { type: String, enum: ["business", "product", "job"] },
      visitedAt: { type: Date, default: Date.now },
    },
  ],
  loyaltyPoints: { type: Number, default: 0 },
  lastLoginDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ["active", "suspended", "banned"],
    default: "active",
  },
  pointsHistory: [
    {
      type: { type: String, enum: ["earn", "redeem"] },
      amount: Number,
      event: {
        type: String,
        enum: [
          "daily_login",
          "listing_product",
          "making_order",
          "five_star_review",
          "redeem_coupon",
          "redeem_upgrade",
        ],
      },
      description: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  refreshToken: { type: String, default: null },
});

userSchema.index({ status: 1 });
userSchema.index({ "subscription.status": 1, "subscription.plan": 1 });

module.exports = mongoose.model("User", userSchema);
