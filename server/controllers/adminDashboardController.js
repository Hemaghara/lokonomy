const User = require("../models/User");
const Business = require("../models/Business");
const Product = require("../models/Product");
const Job = require("../models/Job");
const Plan = require("../models/Plan");
const OnlineStatus = require("../models/OnlineStatus");
const SupportTicket = require("../models/SupportTicket");
const Report = require("../models/Report");

const SubscriptionTransaction = require("../models/SubscriptionTransaction");

exports.getOnlineTrend = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trend = await OnlineStatus.find({
      timestamp: { $gte: twentyFourHoursAgo },
    })
      .sort({ timestamp: 1 })
      .select("count timestamp -_id");

    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const [
      totalUsers,
      totalBusinesses,
      totalProducts,
      totalJobs,
      pendingTickets,
      pendingReports,
      pendingVerifications,
    ] = await Promise.all([
      User.countDocuments(),
      Business.countDocuments(),
      Product.countDocuments(),
      Job.countDocuments(),
      SupportTicket.countDocuments({
        status: { $in: ["open", "in_progress"] },
      }),
      Report.countDocuments({ status: "pending" }),
      Business.countDocuments({ verificationStatus: "pending" }),
    ]);

    const revenueAgg = await SubscriptionTransaction.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          silver: {
            $sum: { $cond: [{ $eq: ["$plan", "silver"] }, "$amount", 0] },
          },
          gold: { $sum: { $cond: [{ $eq: ["$plan", "gold"] }, "$amount", 0] } },
          platinum: {
            $sum: { $cond: [{ $eq: ["$plan", "platinum"] }, "$amount", 0] },
          },
        },
      },
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const revenueBreakdown = {
      silver: revenueAgg[0]?.silver || 0,
      gold: revenueAgg[0]?.gold || 0,
      platinum: revenueAgg[0]?.platinum || 0,
    };

    let userQuery = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      userQuery.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    const recentLimit = startDate && endDate ? 50 : 5;
    const [recentUsers, recentBusinesses] = await Promise.all([
      User.find(userQuery).sort({ createdAt: -1 }).limit(recentLimit),
      Business.find(userQuery).sort({ createdAt: -1 }).limit(recentLimit),
    ]);

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      currUsers,
      prevUsers,
      currBiz,
      prevBiz,
      currProducts,
      prevProducts,
      currJobs,
      prevJobs,
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: currentMonthStart } }),
      User.countDocuments({
        createdAt: { $gte: prevMonthStart, $lt: currentMonthStart },
      }),
      Business.countDocuments({ createdAt: { $gte: currentMonthStart } }),
      Business.countDocuments({
        createdAt: { $gte: prevMonthStart, $lt: currentMonthStart },
      }),
      Product.countDocuments({ createdAt: { $gte: currentMonthStart } }),
      Product.countDocuments({
        createdAt: { $gte: prevMonthStart, $lt: currentMonthStart },
      }),
      Job.countDocuments({ createdAt: { $gte: currentMonthStart } }),
      Job.countDocuments({
        createdAt: { $gte: prevMonthStart, $lt: currentMonthStart },
      }),
    ]);

    const calculateTrend = (curr, prev) => {
      if (prev === 0) return curr > 0 ? "+100%" : "0%";
      const diff = ((curr - prev) / prev) * 100;
      return (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
    };

    const trends = {
      users: calculateTrend(currUsers, prevUsers),
      businesses: calculateTrend(currBiz, prevBiz),
      products: calculateTrend(currProducts, prevProducts),
      jobs: calculateTrend(currJobs, prevJobs),
      revenue: "+15.4%",
    };

    res.json({
      stats: {
        totalUsers,
        totalBusinesses,
        totalProducts,
        totalJobs,
        totalRevenue,
        revenueBreakdown,
        trends,
        pendingTickets,
        pendingReports,
        pendingVerifications,
      },
      recentUsers,
      recentBusinesses,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
