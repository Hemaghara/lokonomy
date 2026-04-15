const Report = require("../models/Report");

exports.submitReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: "Missing required fields" });
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
