const express = require("express");
const router = express.Router();

const adminAuthRoutes = require("./admin/adminAuth");
const adminUserRoutes = require("./admin/adminUser");
const adminDashboardRoutes = require("./admin/adminDashboard");
const adminContentRoutes = require("./admin/adminContent");
const adminMarketplaceRoutes = require("./admin/adminMarketplace");
const adminJobRoutes = require("./admin/adminJobs");
const adminStoriesFeedRoutes = require("./admin/adminStoriesFeed");
const adminSubscriptionRoutes = require("./admin/adminSubscriptions");
const adminNotificationRoutes = require("./admin/adminNotifications");

const adminReviewRoutes = require("./admin/adminReviews");

router.use("/", adminAuthRoutes);
router.use("/", adminUserRoutes);
router.use("/", adminDashboardRoutes);
router.use("/", adminContentRoutes);
router.use("/", adminMarketplaceRoutes);
router.use("/", adminJobRoutes);
router.use("/", adminStoriesFeedRoutes);
router.use("/", adminSubscriptionRoutes);
router.use("/", adminReviewRoutes);
router.use("/notifications", adminNotificationRoutes);

module.exports = router;
