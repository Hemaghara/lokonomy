const SubscriptionBox = require("../models/SubscriptionBox");
const Business = require("../models/Business");
const User = require("../models/User");
const logger = require("../utils/logger");

// Create or update a subscription box (Sellers/Business Owners)
exports.createBox = async (req, res) => {
  try {
    const { name, description, price, frequency, items } = req.body;
    if (!name || !description || !price) {
      return res.status(400).json({ success: false, message: "Name, description and price are required" });
    }

    // Find the business owned by this user
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(403).json({ success: false, message: "Access denied: You do not own a registered business" });
    }

    const box = new SubscriptionBox({
      businessId: business._id,
      name,
      description,
      price: Number(price),
      frequency: frequency || "monthly",
      items: Array.isArray(items) ? items : (items ? items.split(",").map(i => i.trim()) : []),
      subscribers: []
    });

    await box.save();
    res.status(201).json({ success: true, box });
  } catch (err) {
    logger.error({ err }, "Error creating subscription box");
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all subscription boxes owned by this seller
exports.getSellerBoxes = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ success: false, message: "Business not found" });
    }

    const boxes = await SubscriptionBox.find({ businessId: business._id })
      .populate("subscribers", "name email");
    res.json({ success: true, boxes });
  } catch (err) {
    logger.error({ err }, "Error getting seller boxes");
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get subscription boxes for a specific business (Public/Buyer view)
exports.getBusinessBoxes = async (req, res) => {
  try {
    const boxes = await SubscriptionBox.find({ businessId: req.params.businessId, isActive: true });
    res.json({ success: true, boxes });
  } catch (err) {
    logger.error({ err }, "Error getting business boxes");
    res.status(500).json({ success: false, message: err.message });
  }
};

// Subscribe to a box (Buyer)
exports.subscribeToBox = async (req, res) => {
  try {
    const box = await SubscriptionBox.findById(req.params.id);
    if (!box) {
      return res.status(404).json({ success: false, message: "Subscription box not found" });
    }

    if (box.subscribers.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: "You are already subscribed to this box" });
    }

    // Mock charging logic or deduction here (e.g. standard points if applicable, or just mock Razorpay success)
    box.subscribers.push(req.user.id);
    await box.save();

    res.json({ success: true, message: "Subscribed successfully!", box });
  } catch (err) {
    logger.error({ err }, "Error subscribing to box");
    res.status(500).json({ success: false, message: err.message });
  }
};

// Unsubscribe from a box
exports.unsubscribeFromBox = async (req, res) => {
  try {
    const box = await SubscriptionBox.findById(req.params.id);
    if (!box) {
      return res.status(404).json({ success: false, message: "Subscription box not found" });
    }

    const index = box.subscribers.indexOf(req.user.id);
    if (index === -1) {
      return res.status(400).json({ success: false, message: "You are not subscribed to this box" });
    }

    box.subscribers.splice(index, 1);
    await box.save();

    res.json({ success: true, message: "Unsubscribed successfully", box });
  } catch (err) {
    logger.error({ err }, "Error unsubscribing from box");
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get active subscriptions for the logged-in user (Buyer)
exports.getMySubscriptions = async (req, res) => {
  try {
    const boxes = await SubscriptionBox.find({ subscribers: req.user.id })
      .populate("businessId", "businessName logo district taluka");

    res.json({ success: true, subscriptions: boxes });
  } catch (err) {
    logger.error({ err }, "Error getting my subscriptions");
    res.status(500).json({ success: false, message: err.message });
  }
};
