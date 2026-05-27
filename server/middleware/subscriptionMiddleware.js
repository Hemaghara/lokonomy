const User = require("../models/User");
const Plan = require("../models/Plan");
const Settings = require("../models/Settings");

const DEFAULT_FREE_LIMITS = {
  productsUploaded: 10,
  storiesPosted: 15,
  jobsPosted: 5,
  analytics: true,
  featuredListings: false,
  prioritySupport: false,
  chatMessaging: true,
  couponsPerMonth: 0,
  bookingEnabled: false,
  customUrl: false,
  removeBranding: false,
  aiInsights: "none",
  autoResponder: false,
  promotedListings: false,
  guaranteeBadge: false,
  commissionRate: 5,
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

    const user = req.userDoc || await User.findById(req.user.id);
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


const checkUsageLimit = (limitType) => async (req, res, next) => {
  try {

    const user = req.userDoc || await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const plan = getActivePlan(user);
    const planDoc = await getPlanBySlug(plan);
    const limits = planDoc?.limits || DEFAULT_FREE_LIMITS;

    const limitValue = limits[limitType];
    const used = user.usage?.[limitType] || 0;

    const messages = {
      productsUploaded: `Plan Limit Reached: You've already listed ${limitValue} products on your ${plan} plan. Upgrade your membership to keep growing your store!`,
      storiesPosted: `Limit Reached: You've hit your monthly quota of ${limitValue} stories. Upgrade to a premium plan to share more updates!`,
      jobsPosted: `Quota Exhausted: You've posted ${limitValue} jobs. Upgrade your plan to continue hiring the best talent!`,
    };

    if (limitValue < 999999 && used >= limitValue) {
      return res.status(403).json({
        success: false,
        code: "LIMIT_REACHED",
        message: messages[limitType] || `Limit reached for ${limitType}`,
        used,
        limit: limitValue,
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

const checkProductLimit = checkUsageLimit("productsUploaded");
const checkStoryLimit = checkUsageLimit("storiesPosted");
const checkJobLimit = checkUsageLimit("jobsPosted");

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
