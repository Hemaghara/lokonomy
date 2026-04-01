const User = require("../models/User");
const Business = require("../models/Business");
const Product = require("../models/Product");
const Job = require("../models/Job");
const Plan = require("../models/Plan");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBusinesses = await Business.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalJobs = await Job.countDocuments();

    const upgradedUsers = await User.find({
      "subscription.plan": { $ne: "free" },
      "subscription.razorpayPaymentId": { $exists: true, $ne: null },
    });

    const plans = await Plan.find();
    const plansMap = {};
    plans.forEach((p) => {
      plansMap[p.slug] = p.prices;
    });

    let totalRevenue = 0;
    const revenueBreakdown = {
      silver: 0,
      gold: 0,
      platinum: 0,
    };

    upgradedUsers.forEach((user) => {
      const { plan, durationMonths } = user.subscription;
      if (plansMap[plan] && plansMap[plan][durationMonths]) {
        const amount = plansMap[plan][durationMonths];
        totalRevenue += amount;
        if (revenueBreakdown[plan] !== undefined) {
          revenueBreakdown[plan] += amount;
        }
      }
    });

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);

    const recentBusinesses = await Business.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalUsers,
        totalBusinesses,
        totalProducts,
        totalJobs,
        totalRevenue,
        revenueBreakdown,
      },
      recentUsers,
      recentBusinesses,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
