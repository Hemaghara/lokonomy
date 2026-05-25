const mongoose = require("mongoose");

const flashSaleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  maxQuantity: {
    type: Number,
    required: true,
    min: 1,
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ["scheduled", "active", "ended", "cancelled"],
    default: "scheduled",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

flashSaleSchema.index({ businessId: 1 });
flashSaleSchema.index({ status: 1 });
flashSaleSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model("FlashSale", flashSaleSchema);
