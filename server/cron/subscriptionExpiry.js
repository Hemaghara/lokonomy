const cron = require("node-cron");
const User = require("../models/User");

const startSubscriptionCron = () => {
  cron.schedule("30 18 * * *", async () => {
    const now = new Date();
    console.log(
      `[Cron] Running subscription expiry check at ${now.toISOString()}`,
    );

    try {
      const result = await User.updateMany(
        {
          "subscription.status": "active",
          "subscription.expiryDate": { $lt: now },
        },
        {
          $set: {
            "subscription.status": "expired",
            "subscription.plan": "free",
          },
        },
      );

      if (result.modifiedCount > 0) {
        console.log(
          `[Cron] Downgraded ${result.modifiedCount} expired subscription(s) to free plan.`,
        );
      } else {
        console.log("[Cron] No expired subscriptions found.");
      }
    } catch (err) {
      console.error(
        "[Cron] Error during subscription expiry check:",
        err.message,
      );
    }
  });

  console.log(
    "[Cron] Subscription expiry cron job scheduled (daily at midnight IST).",
  );
};

module.exports = { startSubscriptionCron };
