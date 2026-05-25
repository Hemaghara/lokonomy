const Commission = require("../models/Commission");
const Order = require("../models/Order");
const logger = require("../utils/logger");


exports.getCommissionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const commissions = await Commission.find(query).sort({ createdAt: -1 });

    const totalCollected = commissions.reduce(
      (acc, c) => acc + c.commissionAmount,
      0
    );
    const totalOrders = commissions.length;
    const avgRate =
      commissions.length > 0
        ? commissions.reduce((acc, c) => acc + c.commissionRate, 0) /
        commissions.length
        : 0;

    const byPlan = {
      free: { count: 0, total: 0 },
      silver: { count: 0, total: 0 },
      gold: { count: 0, total: 0 },
      platinum: { count: 0, total: 0 },
    };

    commissions.forEach((c) => {
      const plan = c.sellerPlan || "free";
      if (byPlan[plan]) {
        byPlan[plan].count++;
        byPlan[plan].total += c.commissionAmount;
      }
    });

    res.json({
      success: true,
      summary: {
        totalCollected: Math.round(totalCollected * 100) / 100,
        totalOrders,
        averageRate: Math.round(avgRate * 100) / 100,
        byPlan,
      },
      commissions: commissions.slice(0, 50),
    });
  } catch (err) {
    logger.error({ err }, "Error in getCommissionSummary");
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getSellerCommissions = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const commissions = await Commission.find({ sellerId })
      .populate("orderId", "orderStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(100);

    const totalCommission = commissions.reduce(
      (acc, c) => acc + c.commissionAmount,
      0
    );
    const totalPayout = commissions.reduce(
      (acc, c) => acc + c.sellerPayout,
      0
    );
    const totalOrderAmount = commissions.reduce(
      (acc, c) => acc + c.orderAmount,
      0
    );

    res.json({
      success: true,
      summary: {
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalPayout: Math.round(totalPayout * 100) / 100,
        totalOrderAmount: Math.round(totalOrderAmount * 100) / 100,
        totalOrders: commissions.length,
      },
      commissions,
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getSellerCommissions");
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getCommissionRates = async (req, res) => {
  try {
    res.json({
      success: true,
      rates: {
        free: { rate: 5, description: "5% commission on each order" },
        silver: { rate: 4, description: "4% commission — save 20%" },
        gold: { rate: 3, description: "3% commission — save 40%" },
        platinum: { rate: 2, description: "2% commission — save 60%" },
      },
      note: "Upgrade your plan to reduce commission rates and keep more earnings!",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
