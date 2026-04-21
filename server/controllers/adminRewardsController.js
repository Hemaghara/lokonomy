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
    const stats = await User.aggregate([
      {
        $facet: {
          balances: [
            {
              $group: {
                _id: null,
                totalActivePoints: { $sum: "$loyaltyPoints" },
                activeUsers: {
                  $sum: { $cond: [{ $gt: ["$loyaltyPoints", 0] }, 1, 0] },
                },
              },
            },
          ],
          history: [
            { $unwind: "$pointsHistory" },
            {
              $group: {
                _id: "$pointsHistory.type",
                totalAmount: { $sum: "$pointsHistory.amount" },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const balanceStats = stats[0].balances[0] || {
      totalActivePoints: 0,
      activeUsers: 0,
    };
    const historyStats = stats[0].history;

    const earnStats = historyStats.find((h) => h._id === "earn") || {
      totalAmount: 0,
      count: 0,
    };
    const redeemStats = historyStats.find((h) => h._id === "redeem") || {
      totalAmount: 0,
      count: 0,
    };

    res.json({
      success: true,
      stats: {
        totalActivePoints: balanceStats.totalActivePoints,
        totalRedemptions: redeemStats.count,
        totalPointsEarned: earnStats.totalAmount,
        totalPointsRedeemed: redeemStats.totalAmount,
        activeUsers: balanceStats.activeUsers,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

