const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  description: { type: String },
  businessType: { type: String, default: "Shop" },
  mainCategory: { type: String, required: true },
  subCategory: { type: String, required: true },
  logo: { type: String },
  photos: [{ type: String }],
  businessHours: {
    type: Map,
    of: new mongoose.Schema(
      {
        isOpen: { type: Boolean, default: true },
        startTime: { type: String, default: "09:00" },
        endTime: { type: String, default: "18:00" },
      },
      { _id: false },
    ),
  },

  contactNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid 10-digit phone number!`,
    },
  },
  email: { type: String },
  website: { type: String },
  address: { type: String, required: true },
  state: { type: String, default: "Gujarat" },
  district: { type: String, default: null },
  taluka: { type: String, default: null },
  pincode: { type: String },
  // coordinates format: [longitude, latitude]  (GeoJSON standard)
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: null,
    },
  },
  locationAddress: { type: String, default: null },
  facebookLink: { type: String },
  instagramLink: { type: String },
  youtubeLink: { type: String },
  twitterLink: { type: String },
  whatsappNumber: { type: String },
  visits: { type: Number, default: 0 },
  reviews: [
    {
      userId: { type: String },
      userName: { type: String, required: true },
      rating: { type: Number, required: true },
      comment: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  ownerName: { type: String, required: true },
  ownerId: { type: String },
  rating: { type: Number, default: 0.0 },
  verified: { type: Boolean, default: false },
  dailyVisits: [
    {
      date: { type: String, required: true },
      count: { type: Number, default: 0 },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

businessSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Business", businessSchema);
