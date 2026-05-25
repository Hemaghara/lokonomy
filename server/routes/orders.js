const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, orderController.createOrder);
router.get("/buyer", auth, orderController.getBuyerOrders);
router.get("/seller", auth, orderController.getSellerOrders);
router.get("/seller/stats", auth, orderController.getSellerDashboardStats);
router.patch("/:id/status", auth, orderController.updateOrderStatus);
router.patch("/:id/tracking", auth, orderController.updateTracking);

module.exports = router;
