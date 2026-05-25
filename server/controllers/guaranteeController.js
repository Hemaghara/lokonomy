const Guarantee = require("../models/Guarantee");
const Order = require("../models/Order");
const Business = require("../models/Business");
const { createNotification } = require("./notificationController");
const logger = require("../utils/logger");

exports.fileClaim = async (req, res) => {
  try {
    const { orderId, reason, evidence } = req.body;
    if (!orderId || !reason) {
      return res.status(400).json({ success: false, message: "OrderId and reason are required" });
    }

    const order = await Order.findById(orderId).populate("product");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only the buyer of the order can file a claim
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied: You did not place this order" });
    }

    // Check if a claim already exists for this order
    const existing = await Guarantee.findOne({ orderId });
    if (existing) {
      return res.status(400).json({ success: false, message: "A claim has already been filed for this order" });
    }

    // Find the business if possible
    let businessId = null;
    if (order.product && order.product.business) {
      businessId = order.product.business;
    }

    const claim = new Guarantee({
      orderId,
      buyerId: req.user.id,
      sellerId: order.seller,
      businessId,
      reason,
      evidence,
      status: "pending"
    });

    await claim.save();

    // Notify the seller
    try {
      const io = req.app.get("io");
      await createNotification({
        recipientId: order.seller,
        type: "system",
        title: "Lokonomy Guarantee Claim Filed",
        message: `A dispute has been raised for order ${orderId} by the buyer.`,
        actionUrl: `/sales-management`,
        metadata: { orderId },
        io,
      });
    } catch (err) {
      logger.error({ err }, "Error notifying seller of claim");
    }

    res.status(201).json({ success: true, message: "Dispute claim submitted successfully under the Lokonomy Guarantee", claim });
  } catch (err) {
    logger.error({ err }, "Error filing claim");
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getClaimStatus = async (req, res) => {
  try {
    const claim = await Guarantee.findById(req.params.id)
      .populate("orderId")
      .populate("buyerId", "name email")
      .populate("sellerId", "name email");

    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    // Authorized check: buyer, seller or admin
    const userId = req.user.id;
    if (
      claim.buyerId._id.toString() !== userId &&
      claim.sellerId._id.toString() !== userId &&
      req.user.role !== "admin" &&
      req.user.role !== "superadmin"
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, claim });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyClaims = async (req, res) => {
  try {
    const claims = await Guarantee.find({
      $or: [{ buyerId: req.user.id }, { sellerId: req.user.id }]
    })
      .populate("orderId")
      .sort({ createdAt: -1 });

    res.json({ success: true, claims });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin endpoint to resolve disputes
exports.updateClaimStatusByAdmin = async (req, res) => {
  try {
    const { status, resolution, refundAmount } = req.body;
    const claim = await Guarantee.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    if (status) claim.status = status;
    if (resolution) claim.resolution = resolution;
    if (refundAmount !== undefined) claim.refundAmount = Number(refundAmount);

    await claim.save();

    // Notify buyer and seller
    try {
      const io = req.app.get("io");
      await createNotification({
        recipientId: claim.buyerId,
        type: "system",
        title: "Dispute Claim Resolved",
        message: `Your Lokonomy Guarantee claim status was updated to: ${status}.`,
        actionUrl: `/my-orders`,
        io,
      });

      await createNotification({
        recipientId: claim.sellerId,
        type: "system",
        title: "Dispute Claim Resolved",
        message: `The claim for order ${claim.orderId} was updated by admin to: ${status}.`,
        actionUrl: `/sales-management`,
        io,
      });
    } catch (err) {
      logger.error({ err }, "Error notifying parties of claim update");
    }

    res.json({ success: true, message: "Claim status updated successfully", claim });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
