const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { protectAdmin } = require("../middleware/adminMiddleware");
const {
  getLeaderboard,
  calculateLeaderboard,
  getBusinessRanking,
} = require("../controllers/leaderboardController");


router.get("/", getLeaderboard);
router.get("/business/:businessId", getBusinessRanking);
router.post("/calculate", protectAdmin, calculateLeaderboard);

module.exports = router;
