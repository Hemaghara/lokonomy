const mongoose = require("mongoose");
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
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { optionId } = req.body;
    const option = REDEMPTION_OPTIONS.find(o => o.id === optionId);
    
    if (!option) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Invalid option' });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.user.id, loyaltyPoints: { $gte: option.cost } },
      { 
        $inc: { loyaltyPoints: -option.cost },
        $push: { 
          pointsHistory: { 
            $each: [{
              type: 'redeem', amount: option.cost,
              event: option.type === 'coupon' ? 'redeem_coupon' : 'redeem_upgrade',
              description: `Redeemed: ${option.name}`,
              createdAt: new Date(),
            }],
            $position: 0 
          } 
        }
      },
      { new: true, session }
    );

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient points. Need ${option.cost} points.` 
      });
    }

    if (option.type === 'upgrade') {
      const now = new Date();
      const currentExpiry = user.subscription?.expiryDate && new Date(user.subscription.expiryDate) > now
        ? new Date(user.subscription.expiryDate) : now;
      const newExpiry = new Date(currentExpiry.getTime() + option.days * 86400000);
      
      await User.findByIdAndUpdate(
        user._id,
        { 'subscription.expiryDate': newExpiry, 'subscription.status': 'active',
          'subscription.plan': option.plan },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();
    
    return res.json({
      success: true, message: `Redeemed "${option.name}"!`,
      points: user.loyaltyPoints,
      reward: { type: option.type, value: option.value || null, plan: option.plan || null }
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    logger.error({ err, userId: req.user.id }, 'Redeem error');
    return res.status(500).json({ success: false, message: 'Server error' });
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
