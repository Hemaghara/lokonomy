const express = require("express");
const router = express.Router();
const adminMarketplaceController = require("../../controllers/adminMarketplaceController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/marketplace/stats", protectAdmin, adminMarketplaceController.getMarketStats);
router.get("/marketplace/products", protectAdmin, adminMarketplaceController.getAllProducts);
router.get("/marketplace/orders", protectAdmin, adminMarketplaceController.getAllOrders);
router.get("/marketplace/auctions", protectAdmin, adminMarketplaceController.getAllAuctions);
router.patch("/marketplace/products/:id/ban", protectAdmin, adminMarketplaceController.toggleFlagProduct);
router.patch("/marketplace/products/:id/suspend", protectAdmin, adminMarketplaceController.toggleSuspendProduct);
router.get("/marketplace/products/:id", protectAdmin, adminMarketplaceController.getProductDetails);
router.patch("/marketplace/orders/:id/status", protectAdmin, adminMarketplaceController.updateOrderStatus);
router.get("/marketplace/orders/:id", protectAdmin, adminMarketplaceController.getOrderDetails);

module.exports = router;
