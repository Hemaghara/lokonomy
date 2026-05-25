const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createFlashSale,
  getFlashSales,
  getSellerFlashSales,
  cancelFlashSale,
} = require("../controllers/flashSaleController");

router.post("/", auth, createFlashSale);
router.get("/", getFlashSales);
router.get("/seller", auth, getSellerFlashSales);
router.put("/:id/cancel", auth, cancelFlashSale);

module.exports = router;
