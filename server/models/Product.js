const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  mainCategory: { type: String, required: true },
  subCategory: { type: String, required: true },
  productName: { type: String, required: true },
  description: { type: String, required: true },
  priceType: { type: String, enum: ["sell", "rent"], required: true },
  price: { type: Number, required: true },
  district: { type: String },
  taluka: { type: String },
  address: { type: String },
  productImages: [{ type: String }],
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [72.6, 22.3] },
  },
  locationAddress: { type: String },
  sellerProfile: {
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    whatsappNumber: { type: String },
    contactPreference: {
      type: String,
      enum: ["call", "whatsapp", "email"],
      required: true,
    },
    email: { type: String },
    address: { type: String },
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

productSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Product", productSchema);
