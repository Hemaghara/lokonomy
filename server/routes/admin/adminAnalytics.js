const express = require("express");
const router = express.Router();
const {
  getAnalyticsOverview,
  getUserGrowth,
  getBusinessGrowth,
  getJobTrends,
  getRevenueTrends,
  getRegionStats,
} = require("../../controllers/adminAnalyticsController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/overview", protectAdmin, getAnalyticsOverview);
router.get("/users", protectAdmin, getUserGrowth);
router.get("/businesses", protectAdmin, getBusinessGrowth);
router.get("/jobs", protectAdmin, getJobTrends);
router.get("/revenue", protectAdmin, getRevenueTrends);
router.get("/regions", protectAdmin, getRegionStats);

module.exports = router;
