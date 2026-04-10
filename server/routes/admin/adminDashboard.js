const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getOnlineTrend,
} = require("../../controllers/adminDashboardController");
const { globalSearch } = require("../../controllers/adminSearchController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/dashboard-stats", protectAdmin, getDashboardStats);
router.get("/online-trend", protectAdmin, getOnlineTrend);
router.get("/search", protectAdmin, globalSearch);

module.exports = router;
