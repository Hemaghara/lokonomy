const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getLeaderboard,
  calculateLeaderboard,
  getBusinessRanking,
} = require("../controllers/leaderboardController");


router.get("/", getLeaderboard);
router.get("/business/:businessId", getBusinessRanking);
router.post("/calculate", auth, calculateLeaderboard);

module.exports = router;
