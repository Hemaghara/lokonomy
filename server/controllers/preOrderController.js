const PreOrder = require("../models/PreOrder");
const Product = require("../models/Product");
const { createNotification } = require("./notificationController");
const logger = require("../utils/logger");

exports.createPreOrder = async (req, res) => {
  try {
    const { productId, quantity = 1, pickupDate, pickupTime, notes } = req.body;

    if (!productId || !pickupDate || !pickupTime) {
      return res.status(400).json({ message: "Product, pickup date and time are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.isPreOrderEnabled) {
      return res.status(400).json({ message: "Pre-ordering is not enabled for this product" });
    }

    const leadTimeMs = product.preOrderLeadTimeDays * 24 * 60 * 60 * 1000;
    const minPickupDate = new Date(Date.now() + leadTimeMs);
    const chosenPickupDate = new Date(pickupDate);

    if (chosenPickupDate < minPickupDate) {
      return res.status(400).json({
        message: `Pickup date must be at least ${product.preOrderLeadTimeDays} day(s) from now.`
      });
    }

    if (product.maxPreOrders > 0) {
      const activePreOrdersCount = await PreOrder.countDocuments({
        productId,
        status: { $in: ["pending", "accepted"] }
      });
      if (activePreOrdersCount >= product.maxPreOrders) {
        return res.status(400).json({ message: "Pre-order slots are full for this product" });
      }
    }

    let pricePerUnit = product.price;
    if (product.isBulkEnabled && product.bulkPricing && product.bulkPricing.length > 0) {
      const sortedTiers = [...product.bulkPricing].sort((a, b) => b.minQuantity - a.minQuantity);
      const matchingTier = sortedTiers.find(tier => quantity >= tier.minQuantity);
      if (matchingTier) {
        pricePerUnit = matchingTier.pricePerUnit;
      }
    }

    const totalAmount = pricePerUnit * quantity;

    const preOrder = new PreOrder({
      productId,
      buyerId: req.user.id,
      sellerId: product.sellerId,
      quantity,
      pickupDate: chosenPickupDate,
      pickupTime,
      notes,
      totalAmount,
    });

    await preOrder.save();

    // Notify seller
    await createNotification({
      recipient: product.sellerId,
      sender: req.user.id,
      type: "preorder_received",
      title: "New Pre-order Received",
      message: `You received a pre-order request for ${product.productName} (Qty: ${quantity}).`,
      referenceId: preOrder._id,
      onModel: "PreOrder",
    });

    logger.info({ preOrderId: preOrder._id }, "Pre-order created successfully");
    res.status(201).json({ message: "Pre-order requested successfully", preOrder });
  } catch (error) {
    logger.error({ error }, "Error creating pre-order");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getSellerPreOrders = async (req, res) => {
  try {
    const preOrders = await PreOrder.find({ sellerId: req.user.id })
      .populate("productId", "productName price productImages")
      .populate("buyerId", "name email contactNumber")
      .sort({ createdAt: -1 });

    res.json({ preOrders });
  } catch (error) {
    logger.error({ error }, "Error fetching seller pre-orders");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getBuyerPreOrders = async (req, res) => {
  try {
    const preOrders = await PreOrder.find({ buyerId: req.user.id })
      .populate("productId", "productName price productImages")
      .populate("sellerId", "name email contactNumber")
      .sort({ createdAt: -1 });

    res.json({ preOrders });
  } catch (error) {
    logger.error({ error }, "Error fetching buyer pre-orders");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.updatePreOrderStatus = async (req, res) => {
  try {
    const { preOrderId } = req.params;
    const { status } = req.body;

    if (!["accepted", "completed", "cancelled", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const preOrder = await PreOrder.findById(preOrderId).populate("productId", "productName");
    if (!preOrder) {
      return res.status(404).json({ message: "Pre-order not found" });
    }

    const isSeller = preOrder.sellerId.toString() === req.user.id;
    const isBuyer = preOrder.buyerId.toString() === req.user.id;

    if (!isSeller && !isBuyer) {
      return res.status(403).json({ message: "Not authorized to modify this pre-order" });
    }

    if (isBuyer && status !== "cancelled") {
      return res.status(403).json({ message: "Buyers can only cancel their pre-orders" });
    }

    if (isSeller && status === "cancelled") {
      return res.status(403).json({ message: "Sellers cannot cancel a pre-order; they must reject it" });
    }

    preOrder.status = status;
    await preOrder.save();

    const targetUserId = isSeller ? preOrder.buyerId : preOrder.sellerId;
    const senderUserId = req.user.id;

    let notifTitle = "Pre-order Update";
    let notifMsg = `Your pre-order for ${preOrder.productId.productName} has been ${status}.`;

    if (status === "cancelled") {
      notifTitle = "Pre-order Cancelled";
      notifMsg = `The buyer has cancelled the pre-order for ${preOrder.productId.productName}.`;
    } else if (status === "accepted") {
      notifTitle = "Pre-order Accepted";
      notifMsg = `Your pre-order for ${preOrder.productId.productName} is accepted! Ready on pickup date.`;
    }

    await createNotification({
      recipient: targetUserId,
      sender: senderUserId,
      type: "preorder_update",
      title: notifTitle,
      message: notifMsg,
      referenceId: preOrder._id,
      onModel: "PreOrder",
    });

    res.json({ message: `Pre-order ${status} successfully`, preOrder });
  } catch (error) {
    logger.error({ error }, "Error updating pre-order status");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
