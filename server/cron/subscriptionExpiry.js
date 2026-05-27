const cron = require("node-cron");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { sendPushNotification } = require("../utils/pushService");

const startSubscriptionCron = () => {
  cron.schedule("30 18 * * *", async () => {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    console.log(
      `[Cron] Running subscription/notification check at ${now.toISOString()}`,
    );

    try {
      const expiringInThreeDays = await User.find({
        "subscription.status": "active",
        "subscription.expiryDate": {
          $gte: new Date(threeDaysFromNow.setHours(0, 0, 0, 0)),
          $lt: new Date(threeDaysFromNow.setHours(23, 59, 59, 999)),
        },
      });

      console.log(
        `[Cron] Found ${expiringInThreeDays.length} users expiring in 3 days.`,
      );

      for (const user of expiringInThreeDays) {
        const title = "Subscription Expiring Soon";
        const message = `Your subscription expires in 3 days. Renew now to maintain premium benefits.`;

        const newNotification = new Notification({
          recipient: user._id,
          type: "system",
          title,
          message,
          actionUrl: "/subscriptions",
        });
        await newNotification.save();

        await sendPushNotification(user._id, {
          title,
          body: message,
          data: { url: "/subscriptions" },
        });
      }

      const expiringToday = await User.find({
        "subscription.status": "active",
        "subscription.expiryDate": {
          $gte: new Date(now.setHours(0, 0, 0, 0)),
          $lt: new Date(now.setHours(23, 59, 59, 999)),
        },
      });

      console.log(`[Cron] Found ${expiringToday.length} users expiring today.`);

      for (const user of expiringToday) {
        const title = "Subscription Expired Today";
        const message =
          "Your subscription expires today. Renew today to remain active.";

        const newNotification = new Notification({
          recipient: user._id,
          type: "system",
          title,
          message,
          actionUrl: "/subscriptions",
        });
        await newNotification.save();

        await sendPushNotification(user._id, {
          title,
          body: message,
          data: { url: "/subscriptions" },
        });
      }

      const result = await User.updateMany(
        {
          "subscription.status": "active",
          "subscription.expiryDate": { $lt: new Date() },
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
    "[Cron] Subscription expiry and notification cron job scheduled (daily at midnight IST).",
  );
};

module.exports = { startSubscriptionCron };
