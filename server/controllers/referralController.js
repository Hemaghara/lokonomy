const User = require("../models/User");
const logger = require("../utils/logger");

exports.getMyReferralCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "referralCode referralRewards name",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (!user.referralCode) {
      const suffix = user._id.toString().slice(-4).toUpperCase();
      user.referralCode = `LOKO-${suffix}`;
      await user.save();
    }

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const shareableLink = `${appUrl}/register?ref=${user.referralCode}`;

    res.json({
      success: true,
      referralCode: user.referralCode,
      shareableLink,
      stats: {
        totalReferrals: user.referralRewards?.totalReferrals || 0,
        appliedDays: user.referralRewards?.appliedDays || 0,
        pendingDays: user.referralRewards?.pendingDays || 0,
        totalDiscountsGiven: user.referralRewards?.totalDiscountsGiven || 0,
      },
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Error in getMyReferralCode");
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.validateReferralCode = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const referrer = await User.findOne({ referralCode: code }).select(
      "name referralCode",
    );
    if (!referrer) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid referral code" });
    }
    res.json({
      success: true,
      referrerName: referrer.name.split(" ")[0],
      referralCode: referrer.referralCode,
    });
  } catch (err) {
    logger.error(
      { err, code: req.params.code },
      "Error in validateReferralCode",
    );
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.applyReferralReward = async (req, res) => {
  try {
    const { refereeId } = req.body;
    const referee = await User.findById(refereeId || req.user.id);
    if (!referee || !referee.referredBy) {
      return res
        .status(400)
        .json({ success: false, message: "No referral found for user" });
    }

    const referrer = await User.findById(referee.referredBy);
    if (!referrer) {
      return res
        .status(404)
        .json({ success: false, message: "Referrer not found" });
    }

    const currentExpiry = referrer.subscription?.expiryDate
      ? new Date(referrer.subscription.expiryDate)
      : new Date();
    const newExpiry = new Date(
      currentExpiry.getTime() + 15 * 24 * 60 * 60 * 1000,
    );

    await User.findByIdAndUpdate(referrer._id, {
      "subscription.expiryDate": newExpiry,
      $inc: {
        "referralRewards.appliedDays": 15,
        "referralRewards.totalDiscountsGiven": 1,
      },
    });

    logger.info(
      { referrerId: referrer._id, refereeId: referee._id },
      "Referral reward applied successfully",
    );
    res.json({
      success: true,
      message: "Referral reward applied: 15 days added to referrer",
    });
  } catch (err) {
    logger.error(
      { err, refereeId: req.body.refereeId },
      "Error in applyReferralReward",
    );
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.getReferralLeaderboard = async (req, res) => {
  try {
    const leaders = await User.find({
      "referralRewards.totalReferrals": { $gt: 0 },
    })
      .select("name referralCode referralRewards")
      .sort({ "referralRewards.totalReferrals": -1 })
      .limit(10);

    res.json({
      success: true,
      leaderboard: leaders.map((u, i) => ({
        rank: i + 1,
        name: u.name.split(" ")[0],
        referralCode: u.referralCode,
        totalReferrals: u.referralRewards?.totalReferrals || 0,
        appliedDays: u.referralRewards?.appliedDays || 0,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Error in getReferralLeaderboard");
    res.status(500).json({ success: false, message: "Server error" });
  }
};
