const cron = require("node-cron");
const ScheduledNotification = require("../models/ScheduledNotification");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { sendPushNotification } = require("../utils/pushService");

const processScheduledNotifications = async () => {
  try {
    const now = new Date();
    const pendingNotifications = await ScheduledNotification.find({
      status: "pending",
      scheduledFor: { $lte: now },
    });

    if (pendingNotifications.length === 0) return;

    console.log(
      `Processing ${pendingNotifications.length} scheduled notifications...`,
    );

    for (const schedule of pendingNotifications) {
      try {
        let users = [];
        if (schedule.target === "all") {
          users = await User.find({ status: "active" }, "_id");
        } else if (schedule.target === "plan") {
          users = await User.find(
            {
              "subscription.plan": schedule.targetPlan,
              "subscription.status": "active",
              status: "active",
            },
            "_id",
          );
        }

        if (users.length > 0) {
          const notificationPromises = users.map(async (user) => {
            const newNotification = new Notification({
              recipient: user._id,
              type: "system",
              title: schedule.title,
              message: schedule.message,
              actionUrl: schedule.actionUrl || null,
              metadata: {
                adminSent: true,
                scheduledId: schedule._id,
                targetPlan:
                  schedule.target === "plan" ? schedule.targetPlan : undefined,
              },
            });
            await newNotification.save();

            await sendPushNotification(user._id, {
              title: schedule.title,
              body: schedule.message,
              data: { url: schedule.actionUrl || "/" },
            });
          });

          await Promise.all(notificationPromises);
        }

        schedule.status = "sent";
        schedule.sentAt = new Date();
        schedule.recipientCount = users.length;
        await schedule.save();

        console.log(
          `Successfully sent scheduled notification: ${schedule.title} to ${users.length} users`,
        );
      } catch (error) {
        console.error(
          `Error processing scheduled notification ${schedule._id}:`,
          error,
        );
        schedule.status = "failed";
        schedule.error = error.message;
        await schedule.save();
      }
    }
  } catch (error) {
    console.error("Error in scheduled notifications cron:", error);
  }
};

const startScheduledNotificationsCron = () => {
  cron.schedule("* * * * *", processScheduledNotifications);
  console.log("[Cron] Scheduled notifications check started (every minute).");
};

module.exports = { startScheduledNotificationsCron };
