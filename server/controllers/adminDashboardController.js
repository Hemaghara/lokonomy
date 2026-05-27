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
    const now = new Date();

    let currentPeriodStart, currentPeriodEnd, prevPeriodStart, prevPeriodEnd;

    if (startDate || endDate) {
      currentPeriodStart = startDate ? new Date(startDate) : new Date(0);
      currentPeriodEnd = endDate ? new Date(endDate) : new Date();
      currentPeriodEnd.setHours(23, 59, 59, 999);

      const duration = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
      prevPeriodStart = new Date(currentPeriodStart.getTime() - duration);
      prevPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
    } else {
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentPeriodEnd = now;

      prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }

    const totalQuery = {};
    if (endDate) {
      totalQuery.createdAt = { $lte: currentPeriodEnd };
    }

    const [
      totalUsers,
      totalBusinesses,
      totalProducts,
      totalJobs,
      pendingTickets,
      pendingReports,
      pendingVerifications,
    ] = await Promise.all([
      User.countDocuments(totalQuery),
      Business.countDocuments(totalQuery),
      Product.countDocuments(totalQuery),
      Job.countDocuments(totalQuery),
      SupportTicket.countDocuments({
        status: { $in: ["open", "in_progress"] },
      }),
      Report.countDocuments({ status: "pending" }),
      Business.countDocuments({ verificationStatus: "pending" }),
    ]);

    const revenueMatch = { status: "success" };
    if (endDate) {
      revenueMatch.createdAt = { $lte: currentPeriodEnd };
    }

    const revenueAgg = await SubscriptionTransaction.aggregate([
      { $match: revenueMatch },
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
    if (startDate || endDate) {
      userQuery.createdAt = {};
      if (startDate) {
        userQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        userQuery.createdAt.$lte = end;
      }
    }

    const recentLimit = startDate || endDate ? 50 : 5;
    const [recentUsers, recentBusinesses] = await Promise.all([
      User.find(userQuery).sort({ createdAt: -1 }).limit(recentLimit),
      Business.find(userQuery).sort({ createdAt: -1 }).limit(recentLimit),
    ]);

    const [
      currUsers,
      prevUsers,
      currBiz,
      prevBiz,
      currProducts,
      prevProducts,
      currJobs,
      prevJobs,
      currRevenueAgg,
      prevRevenueAgg,
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: currentPeriodStart, $lte: currentPeriodEnd } }),
      User.countDocuments({
        createdAt: { $gte: prevPeriodStart, $lte: prevPeriodEnd },
      }),
      Business.countDocuments({ createdAt: { $gte: currentPeriodStart, $lte: currentPeriodEnd } }),
      Business.countDocuments({
        createdAt: { $gte: prevPeriodStart, $lte: prevPeriodEnd },
      }),
      Product.countDocuments({ createdAt: { $gte: currentPeriodStart, $lte: currentPeriodEnd } }),
      Product.countDocuments({
        createdAt: { $gte: prevPeriodStart, $lte: prevPeriodEnd },
      }),
      Job.countDocuments({ createdAt: { $gte: currentPeriodStart, $lte: currentPeriodEnd } }),
      Job.countDocuments({
        createdAt: { $gte: prevPeriodStart, $lte: prevPeriodEnd },
      }),
      SubscriptionTransaction.aggregate([
        {
          $match: {
            status: "success",
            createdAt: { $gte: currentPeriodStart, $lte: currentPeriodEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
      SubscriptionTransaction.aggregate([
        {
          $match: {
            status: "success",
            createdAt: { $gte: prevPeriodStart, $lte: prevPeriodEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const currRevenue = currRevenueAgg[0]?.total || 0;
    const prevRevenue = prevRevenueAgg[0]?.total || 0;

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
      revenue: calculateTrend(currRevenue, prevRevenue),
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
