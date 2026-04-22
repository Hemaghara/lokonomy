const express = require("express");
const router = express.Router();
const { getFraudSignals, getUserRiskScore, getBusinessScore } = require("../../controllers/adminFraudController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/fraud/signals", protectAdmin, getFraudSignals);
router.get("/fraud/user/:id/risk", protectAdmin, getUserRiskScore);
router.get("/fraud/business/:id/score", protectAdmin, getBusinessScore);

module.exports = router;
