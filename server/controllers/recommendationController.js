const Business = require("../models/Business");
const Product = require("../models/Product");
const Job = require("../models/Job");
const User = require("../models/User");
const Order = require("../models/Order");
const Interaction = require("../models/Interaction");
const logger = require("../utils/logger");

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }

    const latitude = user?.latitude;
    const longitude = user?.longitude;
    const district = user?.district;

    const pastOrders = userId
      ? await Order.find({ buyer: userId }).populate("product")
      : [];
    const preferredCategories = new Set();
    pastOrders.forEach((order) => {
      if (order.product && order.product.mainCategory) {
        preferredCategories.add(order.product.mainCategory);
      }
    });

    const history = user?.browsingHistory || [];
    const historyIds = history.map((h) => h.itemId);
    const viewedProducts = await Product.find({
      _id: { $in: historyIds },
    }).select("mainCategory");
    viewedProducts.forEach((p) => preferredCategories.add(p.mainCategory));

    let recommendedBusinesses = [];
    let recommendedProducts = [];
    let recommendedJobs = [];

    const queryLimit = 4;

    let productQuery = { isSold: false };
    if (preferredCategories.size > 0) {
      productQuery.mainCategory = { $in: Array.from(preferredCategories) };
    }
    if (district) {
      productQuery.district = district;
    }

    recommendedProducts = await Product.find(productQuery)
      .limit(queryLimit)
      .sort({ createdAt: -1 });

    let businessQuery = {};
    if (district) {
      businessQuery.district = district;
    }
    recommendedBusinesses = await Business.find(businessQuery)
      .limit(queryLimit)
      .sort({ rating: -1 });

    let jobQuery = { status: "Open" };
    if (district) {
      jobQuery.district = district;
    }
    recommendedJobs = await Job.find(jobQuery)
      .limit(queryLimit)
      .sort({ createdAt: -1 });

    res.json({
      businesses: recommendedBusinesses,
      products: recommendedProducts,
      jobs: recommendedJobs,
    });
  } catch (err) {
    logger.error({ err, userId: req.user?.id }, "Error in getRecommendations");
    res.status(500).json({ message: "Server error" });
  }
};
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const regex = new RegExp(q, "i");

    const [businesses, products, jobs] = await Promise.all([
      Business.find({ businessName: regex })
        .select("businessName _id")
        .limit(3),
      Product.find({ productName: regex }).select("productName _id").limit(3),
      Job.find({ position: regex }).select("position _id").limit(3),
    ]);

    const suggestions = [
      ...businesses.map((b) => ({
        id: b._id,
        text: b.businessName,
        type: "business",
      })),
      ...products.map((p) => ({
        id: p._id,
        text: p.productName,
        type: "product",
      })),
      ...jobs.map((j) => ({
        id: j._id,
        text: j.position,
        type: "job",
      })),
    ];

    res.json(suggestions);
  } catch (err) {
    logger.error({ err, query: req.query.q }, "Error in getSearchSuggestions");
    res.status(500).json({ message: "Server error" });
  }
};

exports.trackInteraction = async (req, res) => {
  try {
    const { type, itemType, itemId } = req.body;
    const userId = req.user.id;

    const interaction = new Interaction({
      userId,
      type,
      itemType,
      itemId,
    });

    await interaction.save();

    if (type === "view") {
      await User.findByIdAndUpdate(userId, {
        $push: {
          browsingHistory: {
            $each: [{ itemId, itemType, visitedAt: new Date() }],
            $slice: -20,
          },
        },
      });
    }

    res.status(200).json({ message: "Interaction tracked" });
  } catch (err) {
    logger.error(
      { err, userId: req.user.id, body: req.body },
      "Error in trackInteraction",
    );
    res.status(500).json({ message: "Server error" });
  }
};
