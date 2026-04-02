const express = require("express");
const router = express.Router();

const adminAuthRoutes = require("./admin/adminAuth");
const adminUserRoutes = require("./admin/adminUser");
const adminDashboardRoutes = require("./admin/adminDashboard");
const adminContentRoutes = require("./admin/adminContent");
const adminMarketplaceRoutes = require("./admin/adminMarketplace");

router.use("/", adminAuthRoutes);
router.use("/", adminUserRoutes);
router.use("/", adminDashboardRoutes);
router.use("/", adminContentRoutes);
router.use("/", adminMarketplaceRoutes);

module.exports = router;
