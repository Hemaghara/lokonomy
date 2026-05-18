const express = require("express");
const router = express.Router();
const feedController = require("../controllers/feedController");
const auth = require("../middleware/authMiddleware");

router.get("/", feedController.getAllFeeds);
router.get("/:id", feedController.getFeedById);
router.post("/", auth, feedController.createFeed);
router.put("/:id", auth, feedController.updateFeed);
router.post("/:id/like", auth, feedController.toggleLikeFeed);
router.post("/:id/comments", auth, feedController.addFeedComment);
router.delete("/:id/comments/:commentId", auth, feedController.deleteFeedComment);
router.delete("/:id", auth, feedController.deleteFeed);

module.exports = router;
