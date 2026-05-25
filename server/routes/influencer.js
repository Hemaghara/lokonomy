const express = require("express");
const router = express.Router();
const influencerController = require("../controllers/influencerController");
const auth = require("../middleware/authMiddleware");

router.post("/update-status", auth, influencerController.updateInfluencerStatus);
router.post("/vote-helpful", auth, influencerController.voteHelpfulReview);
router.get("/local", influencerController.getLocalInfluencers);

module.exports = router;
