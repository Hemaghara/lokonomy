const express = require("express");
const router = express.Router();
const aiInsightsController = require("../controllers/aiInsightsController");
const auth = require("../middleware/authMiddleware");

router.get("/:businessId", auth, aiInsightsController.getAIInsights);

module.exports = router;
