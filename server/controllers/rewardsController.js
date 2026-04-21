const User = require("../models/User");
const logger = require("../utils/logger");

const POINTS_CONFIG = {
  daily_login: 5,
  listing_product: 10,
  making_order: 20,
  five_star_review: 15,
};

const REDEMPTION_OPTIONS = [
  {
    id: "coupon_5",
    name: "5% Discount Coupon",
    description: "Get 5% off on your next purchase",
    cost: 100,
    type: "coupon",
    value: 5,
  },
  {
    id: "coupon_10",
    name: "10% Discount Coupon",
    description: "Get 10% off on your next purchase",
    cost: 200,
    type: "coupon",
    value: 10,
  },
  {
    id: "coupon_20",
    name: "20% Discount Coupon",
    description: "Get 20% off on your next purchase",
    cost: 400,
    type: "coupon",
    value: 20,
  },
  {
    id: "upgrade_silver",
    name: "Silver Plan (7 Days)",
    description: "Get 7 days of Silver membership free",
    cost: 500,
    type: "upgrade",
    plan: "silver",
    days: 7,
  },
  {
    id: "upgrade_gold",
    name: "Gold Plan (7 Days)",
    description: "Get 7 days of Gold membership free",
    cost: 800,
    type: "upgrade",
    plan: "gold",
    days: 7,
  },
];

const awardPoints = async (userId, event, description) => {
  try {
    const points = POINTS_CONFIG[event];
    if (!points) return null;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { loyaltyPoints: points },
        $push: {
          pointsHistory: {
            $each: [
              {
                type: "earn",
                amount: points,
                event,
                description,
                createdAt: new Date(),
              },
            ],
            $position: 0,
          },
        },
      },
      { new: true },
    );

    logger.info(
      { userId, event, points, total: user?.loyaltyPoints },
      "Points awarded successfully",
    );
    return { points, total: user?.loyaltyPoints || 0 };
  } catch (err) {
    logger.error({ err, userId, event }, "Error in awardPoints helper");
    return null;
  }
};

exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "loyaltyPoints pointsHistory",
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      points: user.loyaltyPoints,
      history: user.pointsHistory.slice(0, 50),
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getBalance");
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRedemptionOptions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("loyaltyPoints");
    res.json({
      success: true,
      points: user?.loyaltyPoints || 0,
      options: REDEMPTION_OPTIONS,
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getRedemptionOptions");
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.redeemReward = async (req, res) => {
  try {
    const { optionId } = req.body;
    const option = REDEMPTION_OPTIONS.find((o) => o.id === optionId);

    if (!option) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid redemption option" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.loyaltyPoints < option.cost) {
      return res.status(400).json({
        success: false,
        message: `Not enough points. You need ${option.cost} points but have ${user.loyaltyPoints}.`,
      });
    }

    user.loyaltyPoints -= option.cost;
    user.pointsHistory.unshift({
      type: "redeem",
      amount: option.cost,
      event: option.type === "coupon" ? "redeem_coupon" : "redeem_upgrade",
      description: `Redeemed: ${option.name}`,
      createdAt: new Date(),
    });

    if (option.type === "upgrade") {
      const now = new Date();
      const currentExpiry =
        user.subscription?.expiryDate &&
        new Date(user.subscription.expiryDate) > now
          ? new Date(user.subscription.expiryDate)
          : now;
      const newExpiry = new Date(
        currentExpiry.getTime() + option.days * 24 * 60 * 60 * 1000,
      );

      const planRank = { free: 0, silver: 1, gold: 2, platinum: 3 };
      const currentRank = planRank[user.subscription?.plan] || 0;
      const newRank = planRank[option.plan] || 0;

      if (newRank >= currentRank) {
        user.subscription = {
          ...user.subscription?.toObject?.(),
          plan: option.plan,
          status: "active",
          startDate: user.subscription?.startDate || now,
          expiryDate: newExpiry,
        };
      } else {
        user.subscription.expiryDate = newExpiry;
      }
    }

    await user.save();
    logger.info(
      { userId: req.user.id, optionId, cost: option.cost },
      "Reward redeemed successfully",
    );

    res.json({
      success: true,
      message: `Successfully redeemed "${option.name}"!`,
      points: user.loyaltyPoints,
      reward: {
        type: option.type,
        value: option.value || null,
        plan: option.plan || null,
        days: option.days || null,
      },
    });
  } catch (err) {
    logger.error(
      { err, userId: req.user.id, optionId: req.body.optionId },
      "Error in redeemReward",
    );
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.claimDailyLogin = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const today = new Date().toDateString();
    const lastLogin = user.lastLoginDate
      ? new Date(user.lastLoginDate).toDateString()
      : null;

    if (lastLogin === today) {
      return res.json({
        success: false,
        message: "Daily login already claimed today",
        alreadyClaimed: true,
        points: user.loyaltyPoints,
      });
    }

    const result = await awardPoints(
      req.user.id,
      "daily_login",
      "Daily login bonus",
    );

    await User.findByIdAndUpdate(req.user.id, { lastLoginDate: new Date() });

    res.json({
      success: true,
      message: `+${POINTS_CONFIG.daily_login} points for daily login!`,
      pointsEarned: POINTS_CONFIG.daily_login,
      points: result?.total || user.loyaltyPoints + POINTS_CONFIG.daily_login,
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in claimDailyLogin");
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.awardPoints = awardPoints;
exports.POINTS_CONFIG = POINTS_CONFIG;
