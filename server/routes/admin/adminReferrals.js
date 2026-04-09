const express = require("express");
const router = express.Router();
const {
  getAllReferrals,
  getTopReferrers,
  getReferralLeaderboard,
} = require("../../controllers/adminReferralController");

const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/referrals/all", protectAdmin, getAllReferrals);
router.get("/referrals/top", protectAdmin, getTopReferrers);
router.get("/referrals/leaderboard", protectAdmin, getReferralLeaderboard);

module.exports = router;
