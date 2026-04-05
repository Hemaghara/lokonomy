const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const auth = require("../middleware/authMiddleware");

router.get("/plans", subscriptionController.getPlans);
router.post("/create-order", auth, subscriptionController.createOrder);
router.post("/verify-payment", auth, subscriptionController.verifyPayment);
router.post("/log-failed-payment", auth, subscriptionController.logFailedPayment);
router.get("/status", auth, subscriptionController.getStatus);

module.exports = router;
