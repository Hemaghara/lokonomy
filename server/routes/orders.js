const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require("../validators/order.schema");

router.post("/", auth, validateRequest(createOrderSchema), orderController.createOrder);
router.get("/buyer", auth, orderController.getBuyerOrders);
router.get("/seller", auth, orderController.getSellerOrders);
router.get("/seller/stats", auth, orderController.getSellerDashboardStats);
router.patch("/:id/status", auth, validateRequest(updateOrderStatusSchema), orderController.updateOrderStatus);
router.patch("/:id/tracking", auth, orderController.updateTracking);

module.exports = router;
