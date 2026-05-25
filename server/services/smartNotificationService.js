const User = require("../models/User");
const Business = require("../models/Business");
const Coupon = require("../models/Coupon");
const Job = require("../models/Job");
const { createNotification } = require("../controllers/notificationController");
const logger = require("../utils/logger");


async function generateSmartDealNotifications(io) {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);


    const activeCoupons = await Coupon.find({
      status: "active",
      expiryDate: { $gt: now },
    }).populate("businessId", "businessName");

    if (activeCoupons.length === 0) return 0;

    const couponBusinessIds = activeCoupons.map((c) => c.businessId?._id?.toString()).filter(Boolean);


    const users = await User.find({
      "browsingHistory.itemType": "business",
      "browsingHistory.visitedAt": { $gte: oneWeekAgo },
    });

    let notifCount = 0;

    for (const user of users) {
      const visitedBusinessIds = user.browsingHistory
        .filter((h) => h.itemType === "business" && h.visitedAt >= oneWeekAgo)
        .map((h) => h.itemId.toString());

      const matches = activeCoupons.filter(
        (c) => c.businessId && visitedBusinessIds.includes(c.businessId._id.toString())
      );

      if (matches.length > 0) {
        const firstMatch = matches[0];
        const bizName = firstMatch.businessId?.businessName || "a business you visited";
        const discount = firstMatch.discountType === "percentage"
          ? `${firstMatch.discount}% off`
          : `₹${firstMatch.discount} off`;

        await createNotification({
          recipientId: user._id,
          type: "smart_deal",
          title: "🏷️ Deal Alert!",
          message: `${bizName} you visited recently now has ${discount}! Use code: ${firstMatch.code}`,
          actionUrl: `/business/${firstMatch.businessId._id}`,
          metadata: {
            couponCode: firstMatch.code,
            businessId: firstMatch.businessId._id,
          },
          io,
        });
        notifCount++;
      }
    }

    logger.info({ count: notifCount }, "[SmartNotif] Deal notifications sent");
    return notifCount;
  } catch (err) {
    logger.error({ err }, "[SmartNotif] Error generating deal notifications");
    return 0;
  }
}

async function generateNewNearbyNotifications(io) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);


    const newBusinesses = await Business.find({
      createdAt: { $gte: oneDayAgo },
    });

    if (newBusinesses.length === 0) return 0;


    let notifCount = 0;
    for (const biz of newBusinesses) {
      if (!biz.district) continue;

      const usersInDistrict = await User.find({
        district: biz.district,
        _id: { $ne: biz.ownerId },
      }).limit(100);

      for (const user of usersInDistrict) {
        await createNotification({
          recipientId: user._id,
          type: "new_nearby",
          title: "🆕 New Business Nearby!",
          message: `${biz.businessName} just opened in ${biz.district}. Check it out!`,
          actionUrl: `/business/${biz._id}`,
          metadata: { businessId: biz._id },
          io,
        });
        notifCount++;
      }
    }

    logger.info({ count: notifCount }, "[SmartNotif] New nearby notifications sent");
    return notifCount;
  } catch (err) {
    logger.error({ err }, "[SmartNotif] Error generating nearby notifications");
    return 0;
  }
}

async function generateJobMatchNotifications(io) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);


    const newJobs = await Job.find({
      createdAt: { $gte: oneDayAgo },
      status: "Open",
      isFlagged: { $ne: true },
      isSuspended: { $ne: true },
    });

    if (newJobs.length === 0) return 0;


    const jobsByDistrict = {};
    for (const job of newJobs) {
      if (!jobsByDistrict[job.district]) jobsByDistrict[job.district] = [];
      jobsByDistrict[job.district].push(job);
    }

    let notifCount = 0;
    for (const [district, jobs] of Object.entries(jobsByDistrict)) {
      const usersInDistrict = await User.find({
        district,
        "jobProfile.skills": { $exists: true, $ne: "" },
      }).limit(50);

      for (const user of usersInDistrict) {
        const userSkills = (user.jobProfile?.skills || "").toLowerCase();
        const matchingJobs = jobs.filter((j) => {
          const jobSkills = (j.skills || "").toLowerCase();
          return userSkills.split(",").some((s) => jobSkills.includes(s.trim()));
        });

        if (matchingJobs.length > 0) {
          await createNotification({
            recipientId: user._id,
            type: "job_match",
            title: "💼 Jobs Matching Your Skills!",
            message: `${matchingJobs.length} new job${matchingJobs.length > 1 ? "s" : ""} matching your skills posted in ${district}`,
            actionUrl: "/jobs",
            metadata: { jobIds: matchingJobs.map((j) => j._id), district },
            io,
          });
          notifCount++;
        }
      }
    }

    logger.info({ count: notifCount }, "[SmartNotif] Job match notifications sent");
    return notifCount;
  } catch (err) {
    logger.error({ err }, "[SmartNotif] Error generating job match notifications");
    return 0;
  }
}

async function runSmartNotifications(io) {
  logger.info("[SmartNotif] Starting smart notification generation...");
  const dealCount = await generateSmartDealNotifications(io);
  const nearbyCount = await generateNewNearbyNotifications(io);
  const jobCount = await generateJobMatchNotifications(io);
  logger.info(
    { dealCount, nearbyCount, jobCount },
    "[SmartNotif] Smart notification generation complete"
  );
  return { dealCount, nearbyCount, jobCount };
}

module.exports = { runSmartNotifications };
