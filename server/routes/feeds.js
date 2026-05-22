const express = require("express");
const router = express.Router();
const feedController = require("../controllers/feedController");
const auth = require("../middleware/authMiddleware");
const { feedLimiter } = require("../middleware/rateLimiter");

router.get("/trending", feedController.getTrendingFeeds);
router.get("/", feedController.getAllFeeds);
router.get("/:id", feedController.getFeedById);
router.get("/:id/related", feedController.getRelatedFeeds);
router.post("/", auth, feedLimiter, feedController.createFeed);
router.put("/:id", auth, feedController.updateFeed);
router.post("/:id/like", auth, feedController.toggleLikeFeed);
router.post("/:id/bookmark", auth, feedController.toggleBookmark);
router.get("/:id/comments", feedController.getFeedComments);
router.post("/:id/comments", auth, feedController.addFeedComment);
router.delete("/:id/comments/:commentId", auth, feedController.deleteFeedComment);
router.delete("/:id", auth, feedController.deleteFeed);

module.exports = router;
