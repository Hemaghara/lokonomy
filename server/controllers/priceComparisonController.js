const Product = require("../models/Product");
const Business = require("../models/Business");
const logger = require("../utils/logger");

exports.comparePrices = async (req, res) => {
  try {
    const { q, category } = req.query;

    if (!q && !category) {
      return res.status(400).json({ message: "Search query or category is required" });
    }

    let query = { isSold: false, isSuspended: false };

    if (q) {
      query.productName = { $regex: q, $options: "i" };
    }
    if (category) {
      query.mainCategory = category;
    }

    const products = await Product.find(query)
      .populate("sellerId", "name email contactNumber")
      .lean();

    // Enrich products with their business details
    const enrichedProducts = await Promise.all(
      products.map(async (prod) => {
        const business = await Business.findOne({ ownerId: prod.sellerId._id }).lean();
        return {
          ...prod,
          business,
        };
      })
    );

    // Filter out products without registered business
    const validProducts = enrichedProducts.filter((p) => p.business);

    res.json({ products: validProducts });
  } catch (error) {
    logger.error({ error }, "Error in price comparison");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
