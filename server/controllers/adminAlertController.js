const User = require("../models/User");
const Report = require("../models/Report");
const SupportTicket = require("../models/SupportTicket");
const Business = require("../models/Business");

exports.getAlerts = async (req, res) => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let hotReports = [];
    try {
      hotReports = await Report.aggregate([
        {
          $group: {
            _id: { targetId: "$targetId", targetType: "$targetType" },
            count: { $sum: 1 },
            latestAt: { $max: "$createdAt" },
          },
        },
        { $match: { count: { $gte: 5 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $project: {
            targetId: "$_id.targetId",
            targetType: "$_id.targetType",
            count: 1,
            latestAt: 1,
            _id: 0,
          },
        },
      ]);
    } catch (_) {}

    let expiringSubscriptions = [];
    try {
      expiringSubscriptions = await User.find({
        "subscription.status": "active",
        "subscription.expiryDate": { $gte: now, $lte: in24h },
      })
        .select("name email subscription.plan subscription.expiryDate")
        .limit(20)
        .lean();
    } catch (_) {}

    let staleKYC = [];
    try {
      staleKYC = await Business.find({
        verificationStatus: "pending",
        createdAt: { $lte: ago24h },
      })
        .select("businessName ownerName district verificationStatus createdAt")
        .limit(20)
        .lean();
    } catch (_) {}

    let staleSupportTickets = [];
    try {
      const ago48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      staleSupportTickets = await SupportTicket.find({
        status: "open",
        createdAt: { $lte: ago48h },
      })
        .select("subject userName userEmail priority createdAt")
        .limit(20)
        .lean();
    } catch (_) {}

    let recentSignupCount = 0;
    try {
      const agoHour = new Date(now.getTime() - 60 * 60 * 1000);
      recentSignupCount = await User.countDocuments({
        createdAt: { $gte: agoHour },
      });
    } catch (_) {}

    const alerts = [];

    hotReports.forEach((r) => {
      alerts.push({
        id: `report-${r.targetId}`,
        type: "report_threshold",
        severity: r.count >= 10 ? "critical" : "warning",
        title: `${r.count} Reports on ${r.targetType}`,
        message: `A ${r.targetType} has received ${r.count} reports and may need immediate review.`,
        targetId: r.targetId,
        targetType: r.targetType,
        count: r.count,
        timestamp: r.latestAt,
        actionPath: `/admin/moderation`,
      });
    });

    expiringSubscriptions.forEach((u) => {
      alerts.push({
        id: `sub-${u._id}`,
        type: "subscription_expiry",
        severity: "warning",
        title: `Subscription Expiring Soon`,
        message: `${u.name} (${u.subscription?.plan} plan) expires within 24 hours.`,
        targetId: u._id,
        targetType: "User",
        timestamp: u.subscription?.expiryDate,
        actionPath: `/admin/churn`,
      });
    });

    staleKYC.forEach((b) => {
      alerts.push({
        id: `kyc-${b._id}`,
        type: "kyc_pending",
        severity: "info",
        title: `KYC Pending > 24h`,
        message: `"${b.businessName}" in ${b.district} has a pending verification request since ${new Date(b.createdAt).toLocaleDateString()}.`,
        targetId: b._id,
        targetType: "Business",
        timestamp: b.createdAt,
        actionPath: `/admin/verification`,
      });
    });

    staleSupportTickets.forEach((t) => {
      alerts.push({
        id: `ticket-${t._id}`,
        type: "stale_ticket",
        severity: t.priority === "high" ? "critical" : "warning",
        title: `Support Ticket Stale`,
        message: `"${t.subject}" from ${t.userName} has been open for 48+ hours without a response.`,
        targetId: t._id,
        targetType: "SupportTicket",
        timestamp: t.createdAt,
        actionPath: `/admin/support`,
      });
    });

    if (recentSignupCount > 50) {
      alerts.push({
        id: "signup-spike",
        type: "system_health",
        severity: "info",
        title: `Signup Spike Detected`,
        message: `${recentSignupCount} new users signed up in the last hour – monitor for bot activity.`,
        timestamp: now,
        actionPath: `/admin/users`,
      });
    }

    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => {
      const sev = severityOrder[a.severity] - severityOrder[b.severity];
      if (sev !== 0) return sev;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.json({
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      info: alerts.filter((a) => a.severity === "info").length,
      alerts,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
