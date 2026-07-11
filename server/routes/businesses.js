const express = require("express");
const router = express.Router();
const businessController = require("../controllers/businessController");
const businessAnalyticsController = require("../controllers/businessAnalyticsController");
const auth = require("../middleware/authMiddleware");

router.get("/", businessController.getAllBusinesses);
router.get("/my", auth, businessController.getMyBusinesses);
router.get("/my/analytics", auth, businessAnalyticsController.getBusinessAnalytics);
router.post("/", auth, businessController.addBusiness);
router.get("/:id", businessController.getBusinessById);
router.post("/:id/visit", businessController.incrementVisitCount);
router.post("/:id/review", auth, businessController.addReview);
router.put("/:id", auth, businessController.updateBusiness);
router.post("/:id/verify", auth, businessController.submitVerification);
router.delete("/:id", auth, businessController.deleteBusiness);

module.exports = router;
