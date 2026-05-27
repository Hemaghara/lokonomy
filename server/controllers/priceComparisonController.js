const Product = require("../models/Product");
const logger = require("../utils/logger");

exports.comparePrices = async (req, res) => {
  try {
    const { q, category } = req.query;

    if (!q && !category) {
      return res
        .status(400)
        .json({ message: "Search query or category is required" });
    }

    // Build match stage — only visible, active, unsold products (handles undefined/missing fields safely)
    const matchStage = {
      isSold: { $ne: true },
      isSuspended: { $ne: true },
      isFlagged: { $ne: true },
      ...(q ? { productName: { $regex: q, $options: "i" } } : {}),
      ...(category ? { mainCategory: category } : {}),
    };

    // Single aggregation: match → limit → join business in one round-trip
    const products = await Product.aggregate([
      { $match: matchStage },
      { $limit: 100 },
      {
        $lookup: {
          from: "businesses",
          localField: "sellerId",
          foreignField: "ownerId",
          as: "business",
        },
      },
      // Only keep products that have a linked business
      { $match: { "business.0": { $exists: true } } },
      {
        $addFields: {
          // Flatten the business array to a single object
          business: { $arrayElemAt: ["$business", 0] },
        },
      },
      {
        $project: {
          productName: 1,
          price: 1,
          productImages: 1,
          productImage: 1,
          mainCategory: 1,
          description: 1,
          "business._id": 1,
          "business.businessName": 1,
          "business.district": 1,
          "business.taluka": 1,
          "business.rating": 1,
          "business.location": 1,
        },
      },
    ]);

    res.json({ products });
  } catch (error) {
    logger.error({ error }, "Error in price comparison");
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
