const express = require("express");
const router = express.Router();
const { getHeatmapData } = require("../../controllers/adminHeatmapController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/heatmap", protectAdmin, getHeatmapData);

module.exports = router;
