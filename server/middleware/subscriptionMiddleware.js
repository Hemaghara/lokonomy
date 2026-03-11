const User = require("../models/User");
const Plan = require("../models/Plan");
const { getPlanLimits } = require("../config/plans");

const checkFeature = (featureName) => async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    console.log(`User:${user}`);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const plan = getActivePlan(user);
    const planDoc = await Plan.findOne({ slug: plan });
    const limits = planDoc?.limits || getPlanLimits(plan);

    if (!limits[featureName]) {
      return res.status(403).json({
        success: false,
        code: "FEATURE_LOCKED",
        message: `The "${featureName}" feature is not available on your ${plan} plan. Please upgrade to access this feature.`,
        requiredPlan: getMinPlanForFeature(featureName),
      });
    }
    req.userPlan = plan;
    req.planLimits = limits;
    next();
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Subscription check failed" });
  }
};

const checkProductLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const plan = getActivePlan(user);
    const planDoc = await Plan.findOne({ slug: plan });
    const limits = planDoc?.limits || getPlanLimits(plan);

    const used = user.usage?.productsUploaded || 0;

    if (limits.productsUpload < 999999 && used >= limits.productsUpload) {
      return res.status(403).json({
        success: false,
        code: "LIMIT_REACHED",
        message: `Plan Limit Reached: You've already listed ${limits.productsUpload} products on your ${plan} plan. Upgrade your membership to keep growing your store!`,
        used,
        limit: limits.productsUpload,
        currentPlan: plan,
      });
    }

    req.userPlan = plan;
    req.planLimits = limits;
    next();
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Subscription check failed" });
  }
};

const checkStoryLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const plan = getActivePlan(user);
    const planDoc = await Plan.findOne({ slug: plan });
    const limits = planDoc?.limits || getPlanLimits(plan);

    const used = user.usage?.storiesPosted || 0;

    if (limits.storiesPost < 999999 && used >= limits.storiesPost) {
      return res.status(403).json({
        success: false,
        code: "LIMIT_REACHED",
        message: `Limit Reached: You've hit your monthly qouta of ${limits.storiesPost} stories. Upgrade to a premium plan to share more updates!`,
        used,
        limit: limits.storiesPost,
        currentPlan: plan,
      });
    }

    req.userPlan = plan;
    req.planLimits = limits;
    next();
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Subscription check failed" });
  }
};

const checkJobLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const plan = getActivePlan(user);
    const planDoc = await Plan.findOne({ slug: plan });
    const limits = planDoc?.limits || getPlanLimits(plan);

    const used = user.usage?.jobsPosted || 0;

    if (limits.jobsPost < 999999 && used >= limits.jobsPost) {
      return res.status(403).json({
        success: false,
        code: "LIMIT_REACHED",
        message: `Quota Exhausted: You've posted ${limits.jobsPost} jobs. Upgrade your plan to continue hiring the best talent!`,
        used,
        limit: limits.jobsPost,
        currentPlan: plan,
      });
    }

    req.userPlan = plan;
    req.planLimits = limits;
    next();
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Subscription check failed" });
  }
};

const getActivePlan = (user) => {
  const sub = user.subscription;
  if (!sub || sub.status !== "active") return "free";
  if (!sub.expiryDate || new Date(sub.expiryDate) < new Date()) return "free";
  return sub.plan || "free";
};

const getMinPlanForFeature = (featureName) => {
  const featureMap = {
    analytics: "gold",
    featuredListings: "platinum",
    prioritySupport: "platinum",
  };
  return featureMap[featureName] || "silver";
};

module.exports = {
  checkFeature,
  checkProductLimit,
  checkStoryLimit,
  checkJobLimit,
  getActivePlan,
};
