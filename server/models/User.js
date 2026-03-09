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
  phoneNumber: { type: String, default: null },
  savedJobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
