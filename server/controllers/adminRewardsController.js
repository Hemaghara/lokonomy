const User = require("../models/User");

exports.getLoyaltyBalances = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments({});
    const users = await User.find({})
      .select("name email loyaltyPoints subscription status createdAt")
      .sort({ loyaltyPoints: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLoyaltyPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const { points, reason } = req.body;

    if (points === undefined || points === null || isNaN(Number(points))) {
      return res
        .status(400)
        .json({ success: false, message: "Valid points value is required" });
    }

    const newPoints = Math.max(0, Number(points));

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const oldPoints = user.loyaltyPoints;
    const diff = newPoints - oldPoints;
    const type = diff >= 0 ? "earn" : "redeem";

    user.loyaltyPoints = newPoints;

    if (diff !== 0) {
      user.pointsHistory.unshift({
        type,
        amount: Math.abs(diff),
        event: "daily_login",
        description:
          reason || `Admin adjusted points from ${oldPoints} to ${newPoints}`,
        createdAt: new Date(),
      });
    }

    await user.save();

    res.json({
      success: true,
      message: `Points updated to ${newPoints} for ${user.name}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        loyaltyPoints: user.loyaltyPoints,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.getRedemptionHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const users = await User.find({
      "pointsHistory.type": "redeem",
    }).select("name email pointsHistory");

    let allRedemptions = [];
    users.forEach((user) => {
      const redemptions = user.pointsHistory
        .filter((h) => h.type === "redeem")
        .map((h) => ({
          _id: h._id,
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          amount: h.amount,
          event: h.event,
          description: h.description,
          createdAt: h.createdAt,
        }));
      allRedemptions = allRedemptions.concat(redemptions);
    });

    allRedemptions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    const total = allRedemptions.length;
    const paginated = allRedemptions.slice(skip, skip + limit);

    res.json({
      success: true,
      history: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRewardsStats = async (req, res) => {
  try {
    const users = await User.find({}).select("loyaltyPoints pointsHistory");

    const totalPoints = users.reduce(
      (sum, u) => sum + (u.loyaltyPoints || 0),
      0,
    );
    const totalRedemptions = users.reduce(
      (sum, u) =>
        sum + (u.pointsHistory || []).filter((h) => h.type === "redeem").length,
      0,
    );
    const totalEarned = users.reduce(
      (sum, u) =>
        sum +
        (u.pointsHistory || [])
          .filter((h) => h.type === "earn")
          .reduce((s, h) => s + (h.amount || 0), 0),
      0,
    );
    const totalRedeemed = users.reduce(
      (sum, u) =>
        sum +
        (u.pointsHistory || [])
          .filter((h) => h.type === "redeem")
          .reduce((s, h) => s + (h.amount || 0), 0),
      0,
    );

    res.json({
      success: true,
      stats: {
        totalActivePoints: totalPoints,
        totalRedemptions,
        totalPointsEarned: totalEarned,
        totalPointsRedeemed: totalRedeemed,
        activeUsers: users.filter((u) => (u.loyaltyPoints || 0) > 0).length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
