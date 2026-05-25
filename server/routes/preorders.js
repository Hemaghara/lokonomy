const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createPreOrder,
  getSellerPreOrders,
  getBuyerPreOrders,
  updatePreOrderStatus
} = require("../controllers/preOrderController");

router.post("/", auth, createPreOrder);
router.get("/seller", auth, getSellerPreOrders);
router.get("/buyer", auth, getBuyerPreOrders);
router.put("/:preOrderId/status", auth, updatePreOrderStatus);

module.exports = router;
