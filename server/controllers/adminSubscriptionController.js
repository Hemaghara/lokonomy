const User = require("../models/User");
const Plan = require("../models/Plan");
const SubscriptionTransaction = require("../models/SubscriptionTransaction");

exports.getSubscriptionTransactions = async (req, res) => {
  try {
    const { plan, status, page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (plan && plan !== "all") filter.plan = plan;
    if (status && status !== "all") filter.status = status;

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      filter.user = { $in: users.map((u) => u._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      SubscriptionTransaction.find(filter)
        .populate("user", "name email phoneNumber subscription")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SubscriptionTransaction.countDocuments(filter),
    ]);

    let liveUserTransactions = [];
    if (!status || status === "all" || status === "success") {
      const userFilter = {
        "subscription.plan": { $ne: "free" },
        "subscription.razorpayPaymentId": { $exists: true, $ne: null },
      };
      if (plan && plan !== "all") userFilter["subscription.plan"] = plan;
      if (search) {
        userFilter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const plans = await Plan.find();
      const plansMap = {};
      plans.forEach((p) => {
        plansMap[p.slug] = p.prices;
      });

      const users = await User.find(userFilter)
        .select("name email phoneNumber subscription")
        .sort({ "subscription.startDate": -1 });

      const existingPaymentIds = transactions.map((t) => t.razorpayPaymentId);
      liveUserTransactions = users
        .filter(
          (u) =>
            u.subscription?.razorpayPaymentId &&
            !existingPaymentIds.includes(u.subscription.razorpayPaymentId),
        )
        .map((u) => ({
          _id: `user_${u._id}`,
          user: {
            _id: u._id,
            name: u.name,
            email: u.email,
            phoneNumber: u.phoneNumber,
          },
          plan: u.subscription.plan,
          durationMonths: u.subscription.durationMonths || 3,
          amount:
            plansMap[u.subscription.plan]?.[
              u.subscription.durationMonths || 3
            ] || 0,
          currency: "INR",
          status: u.subscription.status === "active" ? "success" : "expired",
          razorpayOrderId: u.subscription.razorpayOrderId,
          razorpayPaymentId: u.subscription.razorpayPaymentId,
          failureReason: null,
          createdAt: u.subscription.startDate,
          _isInferred: true,
        }));
    }

    const allTransactions = [
      ...transactions.map((t) => t.toObject()),
      ...liveUserTransactions,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const planCounts = await User.aggregate([
      {
        $match: {
          "subscription.plan": { $ne: "free" },
          "subscription.razorpayPaymentId": { $exists: true, $ne: null },
        },
      },
      { $group: { _id: "$subscription.plan", count: { $sum: 1 } } },
    ]);
    const planStats = { silver: 0, gold: 0, platinum: 0 };
    planCounts.forEach((p) => {
      if (planStats[p._id] !== undefined) planStats[p._id] = p.count;
    });

    const failedCount = await SubscriptionTransaction.countDocuments({
      status: "failed",
    });

    res.json({
      success: true,
      transactions: allTransactions,
      total: total + liveUserTransactions.length,
      totalPages: Math.ceil(
        (total + liveUserTransactions.length) / parseInt(limit),
      ),
      page: parseInt(page),
      planStats,
      failedCount,
    });
  } catch (error) {
    console.error("getSubscriptionTransactions error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getRevenueData = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    const plans = await Plan.find();
    const plansMap = {};
    plans.forEach((p) => {
      plansMap[p.slug] = p.prices;
    });

    const upgradedUsers = await User.find({
      "subscription.plan": { $ne: "free" },
      "subscription.razorpayPaymentId": { $exists: true, $ne: null },
    }).select("subscription");

    const now = new Date();
    let startDate, labels, groupFn;

    switch (period) {
      case "day": {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        labels = Array.from({ length: 24 }, (_, i) => {
          const d = new Date(startDate.getTime() + i * 60 * 60 * 1000);
          return d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            hour12: true,
          });
        });
        groupFn = (date) => {
          const d = new Date(date);
          const hours = Math.floor(
            (d.getTime() - startDate.getTime()) / (60 * 60 * 1000),
          );
          return Math.max(0, Math.min(23, hours));
        };
        break;
      }
      case "week": {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        labels = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          return d.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
          });
        });
        groupFn = (date) => {
          const d = new Date(date);
          const days = Math.floor(
            (d.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
          );
          return Math.max(0, Math.min(6, days));
        };
        break;
      }
      case "year": {
        startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
        labels = Array.from({ length: 12 }, (_, i) => {
          const d = new Date(
            startDate.getFullYear(),
            startDate.getMonth() + i,
            1,
          );
          return d.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });
        });
        groupFn = (date) => {
          const d = new Date(date);
          const months =
            (d.getFullYear() - startDate.getFullYear()) * 12 +
            (d.getMonth() - startDate.getMonth());
          return Math.max(0, Math.min(11, months));
        };
        break;
      }
      default: {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        labels = Array.from({ length: 30 }, (_, i) => {
          const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        });
        groupFn = (date) => {
          const d = new Date(date);
          const days = Math.floor(
            (d.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
          );
          return Math.max(0, Math.min(29, days));
        };
      }
    }

    const dataLength = labels.length;
    const silverData = new Array(dataLength).fill(0);
    const goldData = new Array(dataLength).fill(0);
    const platinumData = new Array(dataLength).fill(0);
    const totalData = new Array(dataLength).fill(0);

    let totalRevenue = 0;
    const revenueBreakdown = { silver: 0, gold: 0, platinum: 0 };

    upgradedUsers.forEach((u) => {
      const { plan, durationMonths, startDate: subStart } = u.subscription;
      const amount = plansMap[plan]?.[durationMonths || 3] || 0;

      totalRevenue += amount;
      if (revenueBreakdown[plan] !== undefined)
        revenueBreakdown[plan] += amount;

      if (subStart && new Date(subStart) >= startDate) {
        const idx = groupFn(subStart);
        if (idx >= 0 && idx < dataLength) {
          totalData[idx] += amount;
          if (plan === "silver") silverData[idx] += amount;
          else if (plan === "gold") goldData[idx] += amount;
          else if (plan === "platinum") platinumData[idx] += amount;
        }
      }
    });

    const txns = await SubscriptionTransaction.find({
      status: "success",
      createdAt: { $gte: startDate },
    });
    txns.forEach((t) => {
      const idx = groupFn(t.createdAt);
      if (idx >= 0 && idx < dataLength) {
        totalData[idx] += t.amount;
        if (t.plan === "silver") silverData[idx] += t.amount;
        else if (t.plan === "gold") goldData[idx] += t.amount;
        else if (t.plan === "platinum") platinumData[idx] += t.amount;
      }
    });

    res.json({
      success: true,
      period,
      labels,
      datasets: {
        total: totalData,
        silver: silverData,
        gold: goldData,
        platinum: platinumData,
      },
      summary: {
        totalRevenue,
        revenueBreakdown,
        periodRevenue: totalData.reduce((s, v) => s + v, 0),
      },
    });
  } catch (error) {
    console.error("getRevenueData error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getFailedPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { status: "failed" };

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      filter.user = { $in: users.map((u) => u._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      SubscriptionTransaction.find(filter)
        .populate("user", "name email phoneNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SubscriptionTransaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      payments,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
    });
  } catch (error) {
    console.error("getFailedPayments error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getFinancialReport = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    const plans = await Plan.find();
    const plansMap = {};
    plans.forEach((p) => {
      plansMap[p.slug] = p.prices;
    });

    const now = new Date();
    let startDate;
    switch (period) {
      case "day":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate(),
        );
        break;
      default:
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate(),
        );
    }

    const allUsers = await User.find({
      "subscription.plan": { $ne: "free" },
      "subscription.razorpayPaymentId": { $exists: true, $ne: null },
    }).select("subscription name email");

    let allTimeRevenue = 0;
    const allTimeByPlan = { silver: 0, gold: 0, platinum: 0 };
    const allTimeByDuration = { 3: 0, 6: 0, 12: 0 };
    const planSubscriberCount = { silver: 0, gold: 0, platinum: 0 };

    allUsers.forEach((u) => {
      const { plan, durationMonths } = u.subscription;
      const amount = plansMap[plan]?.[durationMonths || 3] || 0;
      allTimeRevenue += amount;
      if (allTimeByPlan[plan] !== undefined) allTimeByPlan[plan] += amount;
      if (allTimeByDuration[durationMonths])
        allTimeByDuration[durationMonths] += amount;
      else allTimeByDuration[3] += amount;
      if (planSubscriberCount[plan] !== undefined) planSubscriberCount[plan]++;
    });

    const periodUsers = allUsers.filter(
      (u) =>
        u.subscription.startDate &&
        new Date(u.subscription.startDate) >= startDate,
    );

    let periodRevenue = 0;
    const periodByPlan = { silver: 0, gold: 0, platinum: 0 };
    const periodByDuration = { 3: 0, 6: 0, 12: 0 };

    periodUsers.forEach((u) => {
      const { plan, durationMonths } = u.subscription;
      const amount = plansMap[plan]?.[durationMonths || 3] || 0;
      periodRevenue += amount;
      if (periodByPlan[plan] !== undefined) periodByPlan[plan] += amount;
      if (periodByDuration[durationMonths])
        periodByDuration[durationMonths] += amount;
      else periodByDuration[3] += amount;
    });

    const activeCount = await User.countDocuments({
      "subscription.status": "active",
      "subscription.plan": { $ne: "free" },
    });
    const expiredCount = await User.countDocuments({
      "subscription.status": "expired",
    });
    const failedTxns = await SubscriptionTransaction.countDocuments({
      status: "failed",
    });
    const totalTxns = await SubscriptionTransaction.countDocuments();

    const avgRevenue =
      allUsers.length > 0 ? Math.round(allTimeRevenue / allUsers.length) : 0;

    const planPricing = {};
    plans.forEach((p) => {
      if (p.slug !== "free") planPricing[p.slug] = p.prices;
    });

    res.json({
      success: true,
      report: {
        period,
        periodLabel:
          period === "day"
            ? "Last 24 Hours"
            : period === "week"
              ? "Last 7 Days"
              : period === "year"
                ? "Last 12 Months"
                : "Last 30 Days",
        generatedAt: now.toISOString(),
        allTime: {
          totalRevenue: allTimeRevenue,
          totalSubscribers: allUsers.length,
          revenueByPlan: allTimeByPlan,
          revenueByDuration: allTimeByDuration,
          avgRevenuePerUser: avgRevenue,
        },
        periodStats: {
          revenue: periodRevenue,
          subscribers: periodUsers.length,
          revenueByPlan: periodByPlan,
          revenueByDuration: periodByDuration,
        },
        subscribers: {
          active: activeCount,
          expired: expiredCount,
          byPlan: planSubscriberCount,
        },
        transactions: {
          total: totalTxns,
          failed: failedTxns,
          successRate:
            totalTxns > 0
              ? Math.round(((totalTxns - failedTxns) / totalTxns) * 100)
              : 100,
        },
        planPricing,
      },
    });
  } catch (error) {
    console.error("getFinancialReport error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

exports.exportSubscriptionTransactions = async (req, res) => {
  try {
    const { plan, status, search } = req.query;
    const filter = {};

    if (plan && plan !== "all") filter.plan = plan;
    if (status && status !== "all") filter.status = status;

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      filter.user = { $in: users.map((u) => u._id) };
    }

    const transactions = await SubscriptionTransaction.find(filter)
      .populate("user", "name email phoneNumber")
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "Transaction ID",
      "User Name",
      "User Email",
      "Plan",
      "Amount",
      "Currency",
      "Status",
      "Razorpay Order ID",
      "Razorpay Payment ID",
      "Failure Reason",
      "Date",
    ];

    const rows = transactions.map((t) => [
      t._id,
      t.user?.name || "Deleted User",
      t.user?.email || "N/A",
      t.plan,
      t.amount,
      t.currency,
      t.status,
      t.razorpayOrderId || "N/A",
      t.razorpayPaymentId || "N/A",
      t.failureReason || "None",
      new Date(t.createdAt).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=subscriptions_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
