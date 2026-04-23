const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Plan = require("../models/Plan");
const SubscriptionTransaction = require("../models/SubscriptionTransaction");
const { getActivePlan } = require("../middleware/subscriptionMiddleware");
const { serializeUser } = require("../utils/userSerializer");
const logger = require("../utils/logger");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ "prices.3": 1 });
    logger.debug({ count: plans.length }, "Fetching all plans");

    const plansObj = {};
    plans.forEach((p) => {
      plansObj[p.slug] = {
        name: p.name,
        prices: p.prices,
        limits: p.limits,
      };
    });
    res.json({ success: true, plans: plansObj });
  } catch (err) {
    logger.error({ err }, "Error in getPlans");
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { plan, durationMonths } = req.body;
    logger.info(
      { plan, durationMonths, userId: req.user.id },
      "Creating subscription order",
    );

    if (!plan || !durationMonths) {
      return res
        .status(400)
        .json({ success: false, message: "Plan and duration are required" });
    }

    const planDoc = await Plan.findOne({ slug: plan });

    if (!planDoc || plan === "free") {
      logger.warn({ plan }, "Invalid plan selected for order creation");
      return res
        .status(400)
        .json({ success: false, message: "Invalid plan selected" });
    }

    const validDurations = [3, 6, 12];
    if (!validDurations.includes(parseInt(durationMonths))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid duration selected" });
    }

    const rzpKey = process.env.RAZORPAY_KEY_ID || "";

    const amount = planDoc.prices[durationMonths.toString()];
    if (!amount) {
      logger.error(
        { plan, durationMonths },
        "Price configuration missing for duration",
      );
      return res.status(400).json({
        success: false,
        message: "Price configuration missing for this duration",
      });
    }

    const receipt = `sub_${req.user.id.toString().slice(-8)}_${Date.now()}`;
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: receipt,
      notes: {
        userId: req.user.id,
        plan,
        durationMonths: durationMonths.toString(),
      },
    };

    try {
      const order = await razorpay.orders.create(options);
      logger.info(
        { orderId: order.id, userId: req.user.id },
        "Razorpay order created",
      );

      await User.findByIdAndUpdate(req.user.id, {
        "subscription.razorpayOrderId": order.id,
      });

      await SubscriptionTransaction.create({
        user: req.user.id,
        plan,
        durationMonths: parseInt(durationMonths),
        amount: amount,
        razorpayOrderId: order.id,
        status: "pending",
      });

      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: rzpKey,
        plan,
        durationMonths,
      });
    } catch (rzpErr) {
      logger.error({ err: rzpErr }, "Razorpay API Error");
      const errorMsg =
        rzpErr.error?.description || rzpErr.message || "Razorpay API error";
      res.status(500).json({
        success: false,
        message: "Razorpay service error",
        error: errorMsg,
        detail: rzpErr.error,
      });
    }
  } catch (err) {
    logger.error({ err }, "Internal error during order creation");
    res.status(500).json({
      success: false,
      message: "Server internal error during order creation",
      error: err.message,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      durationMonths,
    } = req.body;

    logger.info(
      { razorpay_order_id, userId: req.user.id },
      "Verifying payment",
    );

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Payment details missing" });
    }
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      logger.error(
        { razorpay_order_id, userId: req.user.id },
        "Payment verification failed: invalid signature",
      );
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed: invalid signature",
      });
    }

    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(durationMonths));

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        subscription: {
          plan,
          status: "active",
          startDate,
          expiryDate,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          durationMonths: parseInt(durationMonths),
        },
      },
      { new: true, session },
    );

    await SubscriptionTransaction.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: "success",
        razorpayPaymentId: razorpay_payment_id,
      },
      { session },
    );

    if (updatedUser.referredBy && !updatedUser.referralRewards?.rewardApplied) {
      const referrer = await User.findById(updatedUser.referredBy).session(
        session,
      );
      if (referrer) {
        const newExpiry = new Date(
          (referrer.subscription?.expiryDate
            ? new Date(referrer.subscription.expiryDate)
            : new Date()
          ).getTime() +
            15 * 86400000,
        );
        await User.findByIdAndUpdate(
          referrer._id,
          {
            "subscription.expiryDate": newExpiry,
            $inc: {
              "referralRewards.appliedDays": 15,
              "referralRewards.totalDiscountsGiven": 1,
            },
          },
          { session },
        );
        await User.findByIdAndUpdate(
          updatedUser._id,
          { "referralRewards.rewardApplied": true },
          { session },
        );
        logger.info(
          { referrerId: updatedUser.referredBy, userId: updatedUser._id },
          "Referral Reward applied: 15 days added to referrer",
        );
      }
    }

    await session.commitTransaction();
    session.endSession();

    const planDoc = await Plan.findOne({ slug: plan });

    res.json({
      success: true,
      message: `${planDoc?.name || plan} plan activated successfully!`,
      user: serializeUser(updatedUser),
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    logger.error({ err, userId: req.user.id }, "Verify Payment Error");
    res
      .status(500)
      .json({ success: false, message: "Failed to verify payment" });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      logger.warn({ userId: req.user.id }, "getStatus: User not found");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let effectivePlan = getActivePlan(user);
    const subData = user.subscription?.toObject?.() || {};

    if (
      subData.status === "active" &&
      subData.expiryDate &&
      new Date(subData.expiryDate) < new Date()
    ) {
      await User.findByIdAndUpdate(req.user.id, {
        "subscription.status": "expired",
      });
      subData.status = "expired";
      effectivePlan = "free";
      logger.info({ userId: req.user.id }, "Subscription expired");
    }

    const planDoc = await Plan.findOne({ slug: effectivePlan });

    let limits = planDoc?.limits;
    if (!limits) {
      const freePlan = await Plan.findOne({ slug: "free" });
      limits = freePlan?.limits || {
        productsUpload: 3,
        storiesPost: 5,
        jobsPost: 2,
        analytics: false,
        featuredListings: false,
        prioritySupport: false,
        chatMessaging: true,
      };
    }

    const isActive = effectivePlan !== "free";

    if (!subData.durationMonths && subData.startDate && subData.expiryDate) {
      const start = new Date(subData.startDate);
      const end = new Date(subData.expiryDate);
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      subData.durationMonths = months;
    }

    res.json({
      success: true,
      subscription: {
        ...subData,
        plan: effectivePlan,
        originalPlan: subData.plan,
        isActive,
        isExpired: subData.status === "expired",
      },
      usage: user.usage,
      limits,
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Status Error");
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    return res.status(403).json({
      success: false,
      message:
        "Subscription cancellation is not allowed. Please contact support for assistance.",
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "Cancel Subscription Error");
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.logFailedPayment = async (req, res) => {
  try {
    const { razorpay_order_id, plan, durationMonths, failureReason } = req.body;
    logger.warn(
      { razorpay_order_id, plan, failureReason, userId: req.user.id },
      "Logging failed payment",
    );

    const planDoc = await Plan.findOne({ slug: plan });
    const amount = planDoc?.prices?.[durationMonths?.toString()] || 0;

    const existing = await SubscriptionTransaction.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: "failed",
        failureReason: failureReason || "Payment failed or cancelled by user",
      },
      { new: true },
    );

    if (!existing) {
      await SubscriptionTransaction.create({
        user: req.user.id,
        plan: plan || "silver",
        durationMonths: parseInt(durationMonths) || 3,
        amount,
        razorpayOrderId: razorpay_order_id,
        status: "failed",
        failureReason: failureReason || "Payment failed or cancelled by user",
      });
    }

    res.json({ success: true, message: "Failed payment logged" });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, "logFailedPayment error");
    res.status(500).json({ success: false, message: "Server error" });
  }
};
