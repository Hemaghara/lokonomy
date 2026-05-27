const webpush = require("web-push");
const User = require("../models/User");
const logger = require("./logger");

webpush.setVapidDetails(
  "mailto:" + (process.env.EMAIL_FROM || "admin@lokonomy.com"),
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to a specific user
 * @param {string} userId - The ID of the user to notify
 * @param {object} payload - The notification payload { title, body, icon, data }
 */
const sendPushNotification = async (userId, payload) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.notificationsEnabled || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title || "New Notification",
      body: payload.body || "",
      icon: payload.icon || "/logo192.png",
      data: payload.data || {},
    });

    const expiredEndpoints = [];

    const sendPromises = user.pushSubscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, notificationPayload);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          logger.info({ userId }, "Push subscription expired. Marking for removal...");
          expiredEndpoints.push(subscription.endpoint);
        } else {
          logger.error({ 
            err: error,
            userId, 
            statusCode: error.statusCode
          }, "Push notification delivery failed");
        }
      }
    });

    await Promise.all(sendPromises);

    if (expiredEndpoints.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: {
          pushSubscriptions: { endpoint: { $in: expiredEndpoints } }
        }
      });
      logger.info({ userId, count: expiredEndpoints.length }, "Expired push subscriptions atomically removed");
    }
  } catch (error) {
    logger.error({ err: error }, "Error in pushService");
  }
};

module.exports = {
  sendPushNotification,
};
