const mongoose = require("mongoose");

const leaderboardSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  businessName: { type: String, required: true },
  businessLogo: { type: String },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  district: { type: String, required: true },
  category: { type: String, required: true },
  rank: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  metrics: {
    orderCount: { type: Number, default: 0 },
    reviewAvg: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 },
    storyEngagement: { type: Number, default: 0 },
    visitCount: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

leaderboardSchema.index({ district: 1, category: 1, year: 1, month: 1, rank: 1 });
leaderboardSchema.index({ businessId: 1, year: 1, month: 1 });

module.exports = mongoose.model("Leaderboard", leaderboardSchema);
