const express = require("express");
const router = express.Router();
const adminRewardsController = require("../../controllers/adminRewardsController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/stats", protectAdmin, adminRewardsController.getRewardsStats);
router.get("/loyalty-balances", protectAdmin, adminRewardsController.getLoyaltyBalances);
router.put("/loyalty-balances/:userId", protectAdmin, adminRewardsController.updateLoyaltyPoints);
router.get("/redemption-history", protectAdmin, adminRewardsController.getRedemptionHistory);

module.exports = router;
