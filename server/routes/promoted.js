const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createPromotion,
  getBusinessPromotions,
  trackImpression,
  trackClick
} = require("../controllers/promotedController");

router.post("/", auth, createPromotion);
router.get("/business/:businessId", auth, getBusinessPromotions);
router.post("/:promotionId/impression", trackImpression);
router.post("/:promotionId/click", trackClick);

module.exports = router;
