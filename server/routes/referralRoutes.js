const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getMyReferralCode,
  validateReferralCode,
  applyReferralReward,
  getReferralLeaderboard,
} = require("../controllers/referralController");


router.get("/my-code", auth, getMyReferralCode);
router.get("/validate/:code", validateReferralCode);
router.post("/apply-reward", auth, applyReferralReward);
router.get("/leaderboard", auth, getReferralLeaderboard);

module.exports = router;
