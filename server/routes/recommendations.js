const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const optionalAuth = require("../middleware/optionalAuth");
const auth = require("../middleware/authMiddleware");

router.get("/", optionalAuth, recommendationController.getRecommendations);
router.get("/suggestions", recommendationController.getSearchSuggestions);
router.post("/interaction", auth, recommendationController.trackInteraction);

module.exports = router;
