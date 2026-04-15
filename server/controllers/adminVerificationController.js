const Business = require("../models/Business");
const notificationController = require("./notificationController");
const adminAuditController = require("./adminAuditController");

exports.getPendingVerifications = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = { verificationStatus: { $in: ["pending", "under_review"] } };

    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: "i" } },
        { mainCategory: { $regex: search, $options: "i" } },
      ];
    }

    const currentPage = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (currentPage - 1) * pageLimit;

    const total = await Business.countDocuments(query);
    const businesses = await Business.find(query)
      .populate("ownerId", "name email phoneNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const stats = {
      pending: await Business.countDocuments({ verificationStatus: "pending" }),
      under_review: await Business.countDocuments({
        verificationStatus: "under_review",
      }),
      verified: await Business.countDocuments({
        verificationStatus: "verified",
      }),
      rejected: await Business.countDocuments({
        verificationStatus: "rejected",
      }),
    };

    res.json({
      businesses,
      currentPage,
      totalPages: Math.ceil(total / pageLimit),
      total,
      stats,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getBusinessForVerification = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).populate(
      "ownerId",
      "name email phoneNumber createdAt",
    );
    if (!business)
      return res.status(404).json({ message: "Business not found" });
    res.json(business);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.approveBusiness = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business)
      return res.status(404).json({ message: "Business not found" });

    business.verificationStatus = "verified";
    business.isVerified = true;
    business.verifiedAt = new Date();
    business.rejectionReason = undefined;
    await business.save();

    await notificationController.createNotification({
      recipientId: business.ownerId,
      type: "system",
      title: "Business Verified! 🛡️",
      message: `Congratulations! ${business.businessName} has been successfully verified. You now have a trust badge.`,
      actionUrl: "/business/verification",
      io: req.app.get("io"),
    });

    await adminAuditController.logAction(
      req.admin.id,
      "BUSINESS_APPROVED",
      `Verified business: ${business.businessName} (ID: ${business._id})`,
      req.ip,
    );

    res.json({ message: "Business approved and verified", business });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.rejectBusiness = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim())
      return res.status(400).json({ message: "Rejection reason is required" });

    const business = await Business.findById(req.params.id);
    if (!business)
      return res.status(404).json({ message: "Business not found" });

    business.verificationStatus = "rejected";
    business.isVerified = false;
    business.rejectionReason = reason.trim();
    await business.save();
    await notificationController.createNotification({
      recipientId: business.ownerId,
      type: "system",
      title: "Verification Update Required",
      message: `Your verification for ${business.businessName} was not approved. Reason: ${reason}`,
      actionUrl: "/business/verification",
      io: req.app.get("io"),
    });

    await adminAuditController.logAction(
      req.admin.id,
      "BUSINESS_REJECTED",
      `Rejected business: ${business.businessName}. Reason: ${reason}`,
      req.ip,
    );

    res.json({ message: "Business rejected", business });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.markUnderReview = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: "under_review" },
      { new: true },
    );
    if (!business)
      return res.status(404).json({ message: "Business not found" });

    await adminAuditController.logAction(
      req.admin.id,
      "BUSINESS_REVIEW_START",
      `Marked business as under review: ${business.businessName}`,
      req.ip,
    );

    res.json({ message: "Business marked under review", business });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
