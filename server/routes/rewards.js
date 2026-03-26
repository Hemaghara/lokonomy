const express = require("express");
const router = express.Router();
const rewardsController = require("../controllers/rewardsController");
const auth = require("../middleware/authMiddleware");

router.get("/balance", auth, rewardsController.getBalance);
router.get("/options", auth, rewardsController.getRedemptionOptions);
router.post("/redeem", auth, rewardsController.redeemReward);
router.post("/daily-login", auth, rewardsController.claimDailyLogin);

module.exports = router;
