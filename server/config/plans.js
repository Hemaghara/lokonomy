const PLANS = {
  free: {
    name: "Free",
    price: 0,
    durationMonths: null,
    limits: {
      productsUpload: 3,
      storiesPost: 5,
      analytics: false,
      featuredListings: false,
      prioritySupport: false,
      chatMessaging: true,
    },
  },
  silver: {
    name: "Silver",
    prices: {
      3: 199,
      6: 349,
      12: 599,
    },
    limits: {
      productsUpload: 20,
      storiesPost: 50,
      analytics: false,
      featuredListings: false,
      prioritySupport: false,
      chatMessaging: true,
    },
  },
  gold: {
    name: "Gold",
    prices: {
      3: 399,
      6: 699,
      12: 1199,
    },
    limits: {
      productsUpload: 100,
      storiesPost: 200,
      analytics: true,
      featuredListings: false,
      prioritySupport: false,
      chatMessaging: true,
    },
  },
  platinum: {
    name: "Platinum",
    prices: {
      3: 799,
      6: 1399,
      12: 2399,
    },
    limits: {
      productsUpload: Infinity,
      storiesPost: Infinity,
      analytics: true,
      featuredListings: true,
      prioritySupport: true,
      chatMessaging: true,
    },
  },
};

const getPlanLimits = (planName) => {
  return PLANS[planName]?.limits || PLANS.free.limits;
};

const getPlanPrice = (planName, durationMonths) => {
  if (!PLANS[planName] || planName === "free") return 0;
  return PLANS[planName].prices[durationMonths] || 0;
};

module.exports = { PLANS, getPlanLimits, getPlanPrice };
