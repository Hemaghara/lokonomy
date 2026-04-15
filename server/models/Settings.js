const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    maintenanceMode: { type: Boolean, default: false },
    featuredBusinesses: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
    ],
    featuredProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],
    seo: {
      homeTitle: {
        type: String,
        default: "Lokonomy - Support Local Businesses",
      },
      homeMetaDescription: {
        type: String,
        default:
          "A platform to discover and support local businesses in your community.",
      },
      keywords: [{ type: String }],
    },
    socialLinks: {
      facebook: { type: String },
      instagram: { type: String },
      twitter: { type: String },
      youtube: { type: String },
      whatsapp: { type: String },
    },
    platformFees: {
      orderCommissionPercentage: { type: Number, default: 0 },
      listingFee: { type: Number, default: 0 },
    },
    referralRewards: {
      pointsPerReferral: { type: Number, default: 100 },
      maxReferralsPerUser: { type: Number, default: 10 },
    },
    moderation: {
      autoFlagThreshold: { type: Number, default: 5 },
      autoNotifyAdmins: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Settings", settingsSchema);
