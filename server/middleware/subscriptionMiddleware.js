const User = require("../models/User");
const Plan = require("../models/Plan");
const Settings = require("../models/Settings");

const DEFAULT_FREE_LIMITS = {
  productsUploaded: 3,
  storiesPosted: 5,
  jobsPosted: 2,
  analytics: false,
  featuredListings: false,
  prioritySupport: false,
  chatMessaging: true,
};

let planCache = null;
let settingsCache = null;
let planCacheTime = 0;
let settingsCacheTime = 0;
const CACHE_TTL = 60000;

async function getPlanBySlug(slug) {
  if (!planCache || Date.now() - planCacheTime > CACHE_TTL) {
    const plans = await Plan.find().lean();
    planCache = Object.fromEntries(plans.map((p) => [p.slug, p]));
    planCacheTime = Date.now();
  }
  return planCache[slug];
}

async function getSettings() {
  if (!settingsCache || Date.now() - settingsCacheTime > CACHE_TTL) {
    settingsCache = await Settings.findOne().lean();
    settingsCacheTime = Date.now();
  }
  return settingsCache;
}

const checkFeature = (featureName) => async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const plan = getActivePlan(user);
    const planDoc = await getPlanBySlug(plan);
    const limits = planDoc?.limits || DEFAULT_FREE_LIMITS;

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
    const planDoc = await getPlanBySlug(plan);
    const limits = planDoc?.limits || DEFAULT_FREE_LIMITS;

    const used = user.usage?.productsUploaded || 0;

    if (limits.productsUploaded < 999999 && used >= limits.productsUploaded) {
      return res.status(403).json({
        success: false,
        code: "LIMIT_REACHED",
        message: `Plan Limit Reached: You've already listed ${limits.productsUploaded} products on your ${plan} plan. Upgrade your membership to keep growing your store!`,
        used,
        limit: limits.productsUploaded,
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
    const planDoc = await getPlanBySlug(plan);
    const limits = planDoc?.limits || DEFAULT_FREE_LIMITS;

    const used = user.usage?.storiesPosted || 0;

    if (limits.storiesPosted < 999999 && used >= limits.storiesPosted) {
      return res.status(403).json({
        success: false,
        code: "LIMIT_REACHED",
        message: `Limit Reached: You've hit your monthly qouta of ${limits.storiesPosted} stories. Upgrade to a premium plan to share more updates!`,
        used,
        limit: limits.storiesPosted,
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
    const planDoc = await getPlanBySlug(plan);
    const limits = planDoc?.limits || DEFAULT_FREE_LIMITS;

    const used = user.usage?.jobsPosted || 0;

    if (limits.jobsPosted < 999999 && used >= limits.jobsPosted) {
      return res.status(403).json({
        success: false,
        code: "LIMIT_REACHED",
        message: `Quota Exhausted: You've posted ${limits.jobsPosted} jobs. Upgrade your plan to continue hiring the best talent!`,
        used,
        limit: limits.jobsPosted,
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
