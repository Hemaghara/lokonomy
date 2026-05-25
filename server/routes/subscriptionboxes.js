const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const subscriptionBoxController = require("../controllers/subscriptionBoxController");

router.post("/", auth, subscriptionBoxController.createBox);
router.get("/seller", auth, subscriptionBoxController.getSellerBoxes);
router.get("/my", auth, subscriptionBoxController.getMySubscriptions);
router.get("/business/:businessId", subscriptionBoxController.getBusinessBoxes);
router.post("/:id/subscribe", auth, subscriptionBoxController.subscribeToBox);
router.post("/:id/unsubscribe", auth, subscriptionBoxController.unsubscribeFromBox);

module.exports = router;
