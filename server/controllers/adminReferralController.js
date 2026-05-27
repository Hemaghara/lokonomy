const User = require("../models/User");
const logger = require("../utils/logger");

exports.getAllReferrals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const referrals = await User.find({ referralCode: { $ne: null } })
      .select("name email referralCode referralRewards createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ referralCode: { $ne: null } });
    const totalReferralsMade = await User.aggregate([
      { $match: { referralCode: { $ne: null } } },
      {
        $group: {
          _id: null,
          count: { $sum: "$referralRewards.totalReferrals" },
        },
      },
    ]);

    res.json({
      success: true,
      referrals,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalReferralsMade: totalReferralsMade[0]?.count || 0,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error in getAllReferrals");
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getTopReferrers = async (req, res) => {
  try {
    const topReferrers = await User.find({
      "referralRewards.totalReferrals": { $gt: 0 },
    })
      .select("name email referralCode referralRewards")
      .sort({ "referralRewards.totalReferrals": -1 })
      .limit(10);

    res.json({
      success: true,
      topReferrers,
    });
  } catch (error) {
    logger.error({ err: error }, "Error in getTopReferrers");
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getReferralLeaderboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const leaderboard = await User.find({
      "referralRewards.totalReferrals": { $gt: 0 },
    })
      .select("name referralCode referralRewards")
      .sort({ "referralRewards.totalReferrals": -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({
      "referralRewards.totalReferrals": { $gt: 0 },
    });

    res.json({
      success: true,
      leaderboard,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error in getReferralLeaderboard");
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
