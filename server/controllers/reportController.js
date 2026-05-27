const Report = require("../models/Report");

const ALLOWED_TARGET_TYPES = [
  "post",
  "feed",
  "story",
  "review",
  "product",
  "business",
  "job",
  "user",
];

const ALLOWED_REASONS = [
  "Spam",
  "Inappropriate content",
  "Harassment",
  "Fraud/Scam",
  "Misleading information",
  "Intellectual property violation",
  "Other",
];

exports.submitReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!ALLOWED_TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({ message: "Invalid target type" });
    }

    if (!ALLOWED_REASONS.includes(reason)) {
      return res.status(400).json({ message: "Invalid reason" });
    }

    const report = new Report({
      reportedBy: req.user.id,
      targetType,
      targetId,
      reason,
      description,
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: "Thank you for your report. Our team will review it.",
      report,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
