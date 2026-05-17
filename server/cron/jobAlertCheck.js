const cron = require("node-cron");
const Job = require("../models/Job");
const JobAlert = require("../models/JobAlert");
const User = require("../models/User");
const emailService = require("../utils/emailService");
const { sendPushNotification } = require("../utils/pushService");
const logger = require("../utils/logger");



const sendJobAlerts = async () => {
  try {
    logger.info("Starting job alert check...");
    const alerts = await JobAlert.find().populate("userId");
    
    for (const alert of alerts) {
      if (!alert.userId || !alert.userId.email) continue;

      const query = {
        createdAt: { $gt: alert.lastNotifiedAt },
        status: "Open",
        isSuspended: { $ne: true },
        isFlagged: { $ne: true },
      };

      if (alert.filters.category && alert.filters.category !== "All") {
        query.category = alert.filters.category;
      }
      if (alert.filters.district) {
        query.district = alert.filters.district;
      }
      if (alert.filters.taluka) {
        query.taluka = alert.filters.taluka;
      }
      if (alert.filters.jobType && alert.filters.jobType !== "All") {
        query.jobType = alert.filters.jobType;
      }
      if (alert.filters.salaryMin) {
        query.salaryMax = { $gte: alert.filters.salaryMin };
      }

      const matchingJobs = await Job.find(query).sort({ createdAt: -1 }).limit(5);

      if (matchingJobs.length > 0) {
        await emailService.sendJobAlertEmail(alert.userId.email, alert.userId.name, matchingJobs);
        
        await sendPushNotification(alert.userId._id, {
          title: "New Jobs Found!",
          body: `We found ${matchingJobs.length} new jobs matching your alerts.`,
          data: { url: "/jobs" }
        });

        alert.lastNotifiedAt = new Date();
        await alert.save();
        logger.info({ userId: alert.userId._id, jobsFound: matchingJobs.length }, "Job alert sent (Email + Push)");
      }

    }
    logger.info("Job alert check completed.");
  } catch (err) {
    logger.error({ err }, "Error in jobAlertCheck cron job");
  }
};

cron.schedule("0 10 * * *", sendJobAlerts);

module.exports = sendJobAlerts;
