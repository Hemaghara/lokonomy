const express = require("express");
const router = express.Router();
const { getAlerts } = require("../../controllers/adminAlertController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/alerts", protectAdmin, getAlerts);

module.exports = router;
