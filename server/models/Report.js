const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: [
        "post",
        "feed",
        "story",
        "review",
        "product",
        "business",
        "job",
        "user",
      ],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
    actionTaken: { type: String },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Report", reportSchema);
