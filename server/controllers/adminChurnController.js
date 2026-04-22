const User = require("../models/User");
const { createNotification } = require("./notificationController");

exports.getChurnData = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const now = new Date();
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const users = await User.find({
      "subscription.status": "active",
      "subscription.expiryDate": { $gte: now, $lte: until },
    })
      .select(
        "name email phoneNumber district subscription lastLoginDate loyaltyPoints",
      )
      .sort({ "subscription.expiryDate": 1 })
      .lean();

    const enriched = users.map((u) => {
      const daysLeft = Math.ceil(
        (new Date(u.subscription.expiryDate) - now) / (1000 * 60 * 60 * 24),
      );
      const daysSinceLogin = u.lastLoginDate
        ? Math.floor((now - new Date(u.lastLoginDate)) / (1000 * 60 * 60 * 24))
        : null;

      let churnRisk = "low";
      if (daysSinceLogin === null || daysSinceLogin > 14) churnRisk = "high";
      else if (daysSinceLogin > 7) churnRisk = "medium";

      return { ...u, daysLeft, daysSinceLogin, churnRisk };
    });

    const summary = {
      total: enriched.length,
      highRisk: enriched.filter((u) => u.churnRisk === "high").length,
      mediumRisk: enriched.filter((u) => u.churnRisk === "medium").length,
      lowRisk: enriched.filter((u) => u.churnRisk === "low").length,
    };

    res.json({ summary, users: enriched });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.sendRenewalReminder = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "name email subscription",
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await createNotification({
      recipientId: user._id,
      type: "renewal_reminder",
      title: "Your subscription is expiring soon!",
      message: `Hi ${user.name}, your ${user.subscription?.plan} plan expires on ${new Date(user.subscription?.expiryDate).toLocaleDateString()}. Renew now to keep your benefits.`,
      io: req.app.get("io"),
    });

    res.json({ message: `Renewal reminder sent to ${user.name}` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
