const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  mainCategory: { type: String, required: true },
  subCategory: { type: String, required: true },
  productName: { type: String, required: true },
  description: { type: String, required: true, maxlength: [5000, "Description cannot exceed 5000 characters"] },
  priceType: { type: String, enum: ["sell", "rent"], required: true },
  price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
  district: { type: String },
  taluka: { type: String },
  address: { type: String },
  productImages: [{ type: String }],
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number] },
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
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: { type: String, required: true },
      rating: { type: Number, required: true },
      comment: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  isSold: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  isAuction: { type: Boolean, default: false },
  startingPrice: { type: Number, min: [0, 'Starting price cannot be negative'] },
  auctionEnd: { type: Date },
  bids: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: { type: String },
      amount: { type: Number },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  currentHighestBid: { type: Number, default: 0, min: 0 },
  isPreOrderEnabled: { type: Boolean, default: false },
  preOrderLeadTimeDays: { type: Number, default: 0 },
  maxPreOrders: { type: Number, default: 0 },
  isBulkEnabled: { type: Boolean, default: false },
  minOrderQuantity: { type: Number, default: 1 },
  bulkPricing: [
    {
      minQuantity: { type: Number, required: true },
      pricePerUnit: { type: Number, required: true },
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

productSchema.index({ location: "2dsphere" });
productSchema.index({ isFlagged: 1, isSold: 1, mainCategory: 1 });
productSchema.index({ sellerId: 1 });

module.exports = mongoose.model("Product", productSchema);
