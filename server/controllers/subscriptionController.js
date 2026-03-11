const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const Plan = require("../models/Plan");
const { getPlanLimits } = require("../config/plans");
const { getActivePlan } = require("../middleware/subscriptionMiddleware");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const buildSubscriptionResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  district: user.district,
  taluka: user.taluka,
  latitude: user.latitude,
  longitude: user.longitude,
  locationName: user.locationName,
  locationPermission: user.locationPermission,
  upiId: user.upiId,
  paymentQrCode: user.paymentQrCode,
  bankName: user.bankName,
  ifscCode: user.ifscCode,
  branch: user.branch,
  accountNumber: user.accountNumber,
  phoneNumber: user.phoneNumber,
  subscription: {
    ...user.subscription,
    durationMonths: user.subscription?.durationMonths,
  },
  usage: user.usage,
});

exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ "prices.3": 1 });
    console.log(`Plans:${plans}`);

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
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { plan, durationMonths } = req.body;
    console.log(`Plan:${plan}`);
    console.log(`Duration Months:${durationMonths}`);

    if (!plan || !durationMonths) {
      return res
        .status(400)
        .json({ success: false, message: "Plan and duration are required" });
    }

    const planDoc = await Plan.findOne({ slug: plan });

    if (!planDoc || plan === "free") {
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
    console.log(`Razorpay Key ID:${rzpKey}`);
    console.log(
      `[Subscription] Creating order for user ${req.user.id}, plan: ${plan}, dur: ${durationMonths}`,
    );
    console.log(`[Subscription] Using Key ID: ${rzpKey.substring(0, 8)}...`);

    const amount = planDoc.prices[durationMonths.toString()];
    console.log("amount1:", amount);
    if (!amount) {
      console.error(
        `[Subscription] Price missing for duration ${durationMonths} in plan ${plan}`,
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
      console.log(`[Subscription] Razorpay order created: ${order.id}`);

      await User.findByIdAndUpdate(req.user.id, {
        "subscription.razorpayOrderId": order.id,
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
      console.error("[Subscription] Razorpay API Error:", rzpErr);
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
    console.error("[Subscription] Internal error:", err);
    res.status(500).json({
      success: false,
      message: "Server internal error during order creation",
      error: err.message,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      durationMonths,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
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
      { new: true },
    );

    const planDoc = await Plan.findOne({ slug: plan });

    res.json({
      success: true,
      message: `${planDoc?.name || plan} plan activated successfully!`,
      user: buildSubscriptionResponse(updatedUser),
    });
  } catch (err) {
    console.error("Verify Payment Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to verify payment" });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    console.log(`User:${user}`);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const effectivePlan = getActivePlan(user);
    const planDoc = await Plan.findOne({ slug: effectivePlan });
    const limits = planDoc?.limits || getPlanLimits(effectivePlan);

    const isActive = effectivePlan !== "free";

    const subData = user.subscription?.toObject?.() || {};
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
        isActive,
      },
      usage: user.usage,
      limits,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    return res.status(403).json({
      success: false,
      message: "Subscription cancellation is not allowed. Please contact support for assistance.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
