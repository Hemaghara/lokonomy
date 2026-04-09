const User = require("../models/User");
const Business = require("../models/Business");
const Job = require("../models/Job");
const SubscriptionTransaction = require("../models/SubscriptionTransaction");
const Plan = require("../models/Plan");

function getGroupExpr(period) {
  switch (period) {
    case "daily":
      return {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };
    case "weekly":
      return {
        year: { $year: "$createdAt" },
        week: { $isoWeek: "$createdAt" },
      };
    case "yearly":
      return { year: { $year: "$createdAt" } };
    case "monthly":
    default:
      return {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };
  }
}

function labelGroup(g, period) {
  if (period === "daily") {
    return `${g._id.year}-${String(g._id.month).padStart(2, "0")}-${String(g._id.day).padStart(2, "0")}`;
  }
  if (period === "weekly")
    return `${g._id.year}-W${String(g._id.week).padStart(2, "0")}`;
  if (period === "yearly") return `${g._id.year}`;
  return `${g._id.year}-${String(g._id.month).padStart(2, "0")}`;
}

function getDateFilter(period) {
  const now = new Date();
  let from;
  switch (period) {
    case "daily":
      from = new Date(now);
      from.setDate(now.getDate() - 29);
      break;
    case "weekly":
      from = new Date(now);
      from.setDate(now.getDate() - 7 * 11);
      break;
    case "yearly":
      from = new Date(now);
      from.setFullYear(now.getFullYear() - 4);
      break;
    case "monthly":
    default:
      from = new Date(now);
      from.setMonth(now.getMonth() - 11);
  }
  from.setHours(0, 0, 0, 0);
  return { $gte: from };
}

exports.getAnalyticsOverview = async (req, res) => {
  try {
    const [totalUsers, totalBusinesses, totalJobs, txStats] = await Promise.all(
      [
        User.countDocuments(),
        Business.countDocuments(),
        Job.countDocuments(),
        SubscriptionTransaction.aggregate([
          { $match: { status: "success" } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$amount" },
              totalTx: { $sum: 1 },
            },
          },
        ]),
      ],
    );

    // Calculate fallback revenue from User collection for legacy data
    const plans = await Plan.find();
    const plansMap = {};
    plans.forEach((p) => {
      plansMap[p.slug] = p.prices;
    });

    const activeUsers = await User.find({
      "subscription.status": "active",
      "subscription.razorpayPaymentId": { $exists: true, $ne: null },
    });

    let legacyRevenue = 0;
    activeUsers.forEach((u) => {
      const { plan, durationMonths } = u.subscription;
      if (plansMap[plan] && plansMap[plan][durationMonths]) {
        legacyRevenue += plansMap[plan][durationMonths];
      }
    });

    const appAgg = await Job.aggregate([
      { $project: { appCount: { $size: { $ifNull: ["$applications", []] } } } },
      { $group: { _id: null, total: { $sum: "$appCount" } } },
    ]);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [newUsers, newBusinesses, newJobs] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      Business.countDocuments({ createdAt: { $gte: monthStart } }),
      Job.countDocuments({ createdAt: { $gte: monthStart } }),
    ]);

    const totalRevenue = (txStats[0]?.totalRevenue || 0) + legacyRevenue;
    const totalApplications = appAgg[0]?.total || 0;

    const revThisMonth = await SubscriptionTransaction.aggregate([
      { $match: { status: "success", createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      totalUsers,
      totalBusinesses,
      totalJobs,
      totalApplications,
      totalRevenue,
      newUsersThisMonth: newUsers,
      newBusinessesThisMonth: newBusinesses,
      newJobsThisMonth: newJobs,
      revenueThisMonth: revThisMonth[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserGrowth = async (req, res) => {
  try {
    const period = req.query.period || "monthly";
    const groupExpr = getGroupExpr(period);
    const dateFilter = getDateFilter(period);

    const data = await User.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: groupExpr, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } },
    ]);

    const result = data.map((g) => ({
      label: labelGroup(g, period),
      count: g.count,
    }));

    let running = 0;
    const cumulative = result.map((r) => {
      running += r.count;
      return { label: r.label, count: running };
    });

    res.json({ series: result, cumulative });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getBusinessGrowth = async (req, res) => {
  try {
    const period = req.query.period || "monthly";
    const groupExpr = getGroupExpr(period);
    const dateFilter = getDateFilter(period);

    const data = await Business.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: groupExpr, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } },
    ]);

    const result = data.map((g) => ({
      label: labelGroup(g, period),
      count: g.count,
    }));
    res.json({ series: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getJobTrends = async (req, res) => {
  try {
    const period = req.query.period || "monthly";
    const groupExpr = getGroupExpr(period);
    const dateFilter = getDateFilter(period);

    const jobData = await Job.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: groupExpr, jobs: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } },
    ]);

    const appData = await Job.aggregate([
      { $unwind: { path: "$applications", preserveNullAndEmptyArrays: false } },
      { $match: { "applications.appliedAt": dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: "$applications.appliedAt" },
            month: { $month: "$applications.appliedAt" },
            week:
              period === "weekly"
                ? { $isoWeek: "$applications.appliedAt" }
                : undefined,
            day:
              period === "daily"
                ? { $dayOfMonth: "$applications.appliedAt" }
                : undefined,
          },
          applications: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } },
    ]);

    const jobMap = {};
    jobData.forEach((g) => {
      const lbl = labelGroup(g, period);
      jobMap[lbl] = { jobs: g.jobs, applications: 0 };
    });

    appData.forEach((g) => {
      const lbl = labelGroup(g, period);
      if (!jobMap[lbl]) jobMap[lbl] = { jobs: 0, applications: 0 };
      jobMap[lbl].applications = g.applications;
    });

    const labels = Object.keys(jobMap).sort();
    const series = labels.map((lbl) => ({
      label: lbl,
      jobs: jobMap[lbl].jobs,
      applications: jobMap[lbl].applications,
    }));

    res.json({ series });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getRevenueTrends = async (req, res) => {
  try {
    const period = req.query.period || "monthly";
    const groupExpr = getGroupExpr(period);
    const dateFilter = getDateFilter(period);

    const txData = await SubscriptionTransaction.aggregate([
      { $match: { status: "success", createdAt: dateFilter } },
      {
        $group: {
          _id: { ...groupExpr, plan: "$plan" },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const userData = await User.aggregate([
      {
        $match: {
          "subscription.status": "active",
          "subscription.razorpayPaymentId": { $exists: true, $ne: null },
          "subscription.startDate": dateFilter,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$subscription.startDate" },
            month: { $month: "$subscription.startDate" },
            week:
              period === "weekly"
                ? { $isoWeek: "$subscription.startDate" }
                : undefined,
            day:
              period === "daily"
                ? { $dayOfMonth: "$subscription.startDate" }
                : undefined,
            plan: "$subscription.plan",
          },
          count: { $sum: 1 },
          durationMonths: { $first: "$subscription.durationMonths" },
        },
      },
    ]);

    const plans = await Plan.find();
    const plansMap = {};
    plans.forEach((p) => {
      plansMap[p.slug] = p.prices;
    });

    const bucketMap = {};
    const addToBucket = (g, rev) => {
      const lbl = labelGroup({ _id: g._id }, period);
      if (!bucketMap[lbl])
        bucketMap[lbl] = {
          label: lbl,
          total: 0,
          silver: 0,
          gold: 0,
          platinum: 0,
          count: 0,
        };
      const plan = g._id.plan;
      bucketMap[lbl][plan] = (bucketMap[lbl][plan] || 0) + rev;
      bucketMap[lbl].total += rev;
      bucketMap[lbl].count += g.count || 1;
    };

    txData.forEach((g) => addToBucket(g, g.revenue));
    userData.forEach((g) => {
      const amount =
        (plansMap[g._id.plan] && plansMap[g._id.plan][g.durationMonths]) || 0;
      addToBucket(g, amount * g.count);
    });

    const series = Object.values(bucketMap).sort((a, b) =>
      a.label.localeCompare(b.label),
    );

    const planBreakdown = [
      { _id: "silver", total: 0, count: 0 },
      { _id: "gold", total: 0, count: 0 },
      { _id: "platinum", total: 0, count: 0 },
    ];

    series.forEach((s) => {
      planBreakdown[0].total += s.silver;
      planBreakdown[1].total += s.gold;
      planBreakdown[2].total += s.platinum;
      planBreakdown[0].count += s.silver > 0 ? 1 : 0;
      planBreakdown[1].count += s.gold > 0 ? 1 : 0;
      planBreakdown[2].count += s.platinum > 0 ? 1 : 0;
    });

    res.json({ series, planBreakdown });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
