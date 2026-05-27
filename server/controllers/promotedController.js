const PromotedListing = require("../models/PromotedListing");
const Business = require("../models/Business");
const logger = require("../utils/logger");

exports.createPromotion = async (req, res) => {
  try {
    const { businessId, type, budget, startDate, endDate, paymentId } = req.body;

    if (!businessId || !type || !budget || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    if (business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to promote this business" });
    }

    const promotion = new PromotedListing({
      businessId,
      ownerId: req.user.id,
      type,
      budget,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      paymentId,
      status: "active",
    });

    await promotion.save();


    if (type === "featured_badge") {
      business.isFeatured = true;
      await business.save();
    }

    logger.info({ promotionId: promotion._id, businessId }, "Promoted listing created successfully");
    res.status(201).json({ message: "Promotion created successfully", promotion });
  } catch (error) {
    logger.error({ error }, "Error creating promotion");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


exports.getBusinessPromotions = async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    if (business.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view promotions for this business" });
    }

    const promotions = await PromotedListing.find({ businessId }).sort({ createdAt: -1 });
    res.json({ promotions });
  } catch (error) {
    logger.error({ error }, "Error fetching business promotions");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


exports.trackImpression = async (req, res) => {
  try {
    const { promotionId } = req.params;
    const promotion = await PromotedListing.findById(promotionId);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    if (promotion.status !== "active") {
      return res.json({ message: "Promotion is not active" });
    }


    const costPerImpression = 0.10;
    promotion.impressions += 1;
    promotion.spent += costPerImpression;

    if (promotion.spent >= promotion.budget) {
      promotion.status = "completed";


      if (promotion.type === "featured_badge") {
        const otherActive = await PromotedListing.findOne({
          businessId: promotion.businessId,
          type: "featured_badge",
          status: "active",
          _id: { $ne: promotion._id }
        });
        if (!otherActive) {
          await Business.findByIdAndUpdate(promotion.businessId, { isFeatured: false });
        }
      }
    }

    await promotion.save();
    res.json({ message: "Impression tracked successfully", promotion });
  } catch (error) {
    logger.error({ error }, "Error tracking promotion impression");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


exports.trackClick = async (req, res) => {
  try {
    const { promotionId } = req.params;
    const promotion = await PromotedListing.findById(promotionId);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    if (promotion.status !== "active") {
      return res.json({ message: "Promotion is not active" });
    }


    const costPerClick = 1.50;
    promotion.clicks += 1;
    promotion.spent += costPerClick;

    if (promotion.spent >= promotion.budget) {
      promotion.status = "completed";

      if (promotion.type === "featured_badge") {
        const otherActive = await PromotedListing.findOne({
          businessId: promotion.businessId,
          type: "featured_badge",
          status: "active",
          _id: { $ne: promotion._id }
        });
        if (!otherActive) {
          await Business.findByIdAndUpdate(promotion.businessId, { isFeatured: false });
        }
      }
    }

    await promotion.save();
    res.json({ message: "Click tracked successfully", promotion });
  } catch (error) {
    logger.error({ error }, "Error tracking promotion click");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
