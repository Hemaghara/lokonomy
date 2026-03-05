const express = require("express");
const router = express.Router();
const businessController = require("../controllers/businessController");
const auth = require("../middleware/authMiddleware");

router.get("/", businessController.getAllBusinesses);
router.get("/my", auth, businessController.getMyBusinesses);
router.post("/", auth, businessController.addBusiness);
router.get("/:id", businessController.getBusinessById);
router.post("/:id/visit", businessController.incrementVisitCount);
router.post("/:id/review", auth, businessController.addReview);
router.put("/:id", auth, businessController.updateBusiness);
router.delete("/:id", auth, businessController.deleteBusiness);

module.exports = router;
