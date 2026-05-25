const FlashSale = require("../models/FlashSale");
const Product = require("../models/Product");
const Business = require("../models/Business");
const logger = require("../utils/logger");

// Helper to update flash sale statuses dynamically based on time
const updateStatusBasedOnTime = async (sales) => {
  const now = new Date();
  let updated = false;

  for (let sale of sales) {
    let newStatus = sale.status;

    if (sale.status === "scheduled" && now >= sale.startTime && now < sale.endTime) {
      newStatus = "active";
    } else if ((sale.status === "scheduled" || sale.status === "active") && now >= sale.endTime) {
      newStatus = "ended";
    } else if (sale.status === "active" && sale.soldCount >= sale.maxQuantity) {
      newStatus = "ended";
    }

    if (newStatus !== sale.status) {
      sale.status = newStatus;
      await sale.save();
      updated = true;
    }
  }

  return updated;
};

// Create a new flash sale
exports.createFlashSale = async (req, res) => {
  try {
    const { productId, salePrice, startTime, endTime, maxQuantity } = req.body;

    if (!productId || !salePrice || !startTime || !endTime || !maxQuantity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Verify ownership via business
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business || product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to create flash sale for this product" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: "Start time must be in the future" });
    }

    // Check for overlapping flash sales for the same product
    const existingOverlapping = await FlashSale.findOne({
      productId,
      status: { $in: ["scheduled", "active"] },
      $or: [
        { startTime: { $lte: start }, endTime: { $gte: start } },
        { startTime: { $lte: end }, endTime: { $gte: end } },
        { startTime: { $gte: start }, endTime: { $lte: end } }
      ]
    });

    if (existingOverlapping) {
      return res.status(400).json({ message: "This product already has a scheduled or active flash sale during this period" });
    }

    const flashSale = new FlashSale({
      productId,
      businessId: business._id,
      sellerId: req.user.id,
      originalPrice: product.price,
      salePrice,
      startTime: start,
      endTime: end,
      maxQuantity,
      status: start <= new Date() ? "active" : "scheduled"
    });

    await flashSale.save();
    logger.info({ flashSaleId: flashSale._id }, "Flash sale created successfully");
    res.status(201).json({ message: "Flash sale scheduled successfully", flashSale });
  } catch (error) {
    logger.error({ error }, "Error creating flash sale");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all active / scheduled flash sales for buyers
exports.getFlashSales = async (req, res) => {
  try {
    // Perform dynamic status update on scheduled and active sales first
    const pendingSales = await FlashSale.find({ status: { $in: ["scheduled", "active"] } });
    await updateStatusBasedOnTime(pendingSales);

    // Fetch active ones
    const activeSales = await FlashSale.find({ status: "active" })
      .populate("productId", "productName price productImages description")
      .populate("businessId", "businessName logo district taluka")
      .sort({ endTime: 1 });

    const scheduledSales = await FlashSale.find({ status: "scheduled" })
      .populate("productId", "productName price productImages description")
      .populate("businessId", "businessName logo district taluka")
      .sort({ startTime: 1 });

    res.json({ active: activeSales, scheduled: scheduledSales });
  } catch (error) {
    logger.error({ error }, "Error fetching flash sales");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get seller's own flash sales
exports.getSellerFlashSales = async (req, res) => {
  try {
    const allSellerSales = await FlashSale.find({ sellerId: req.user.id })
      .populate("productId", "productName price productImages")
      .sort({ createdAt: -1 });

    await updateStatusBasedOnTime(allSellerSales);

    res.json({ flashSales: allSellerSales });
  } catch (error) {
    logger.error({ error }, "Error fetching seller flash sales");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Cancel a scheduled/active flash sale
exports.cancelFlashSale = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await FlashSale.findById(id);

    if (!sale) {
      return res.status(404).json({ message: "Flash sale not found" });
    }

    if (sale.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to cancel this flash sale" });
    }

    if (sale.status === "ended" || sale.status === "cancelled") {
      return res.status(400).json({ message: `Flash sale has already ${sale.status}` });
    }

    sale.status = "cancelled";
    await sale.save();

    logger.info({ flashSaleId: id }, "Flash sale cancelled");
    res.json({ message: "Flash sale cancelled successfully", flashSale: sale });
  } catch (error) {
    logger.error({ error }, "Error cancelling flash sale");
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
