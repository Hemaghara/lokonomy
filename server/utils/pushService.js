const webpush = require("web-push");
const User = require("../models/User");

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

    const sendPromises = user.pushSubscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, notificationPayload);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
        
          console.log(`Push subscription for user ${userId} expired. Removing...`);
          user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== subscription.endpoint);
          await user.save();
        } else {
          console.error("Error sending push notification:", error);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error("Error in pushService:", error);
  }
};

module.exports = {
  sendPushNotification,
};
