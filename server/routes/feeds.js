const express = require("express");
const router = express.Router();
const feedController = require("../controllers/feedController");
const auth = require("../middleware/authMiddleware");
const { feedLimiter } = require("../middleware/rateLimiter");
const validateRequest = require("../middleware/validateRequest");
const {
  createFeedSchema,
  updateFeedSchema,
  createCommentSchema,
} = require("../validators/social.schema");

router.get("/trending", feedController.getTrendingFeeds);
router.get("/", feedController.getAllFeeds);
router.get("/:id", feedController.getFeedById);
router.get("/:id/related", feedController.getRelatedFeeds);
router.post("/", auth, feedLimiter, validateRequest(createFeedSchema), feedController.createFeed);
router.put("/:id", auth, validateRequest(updateFeedSchema), feedController.updateFeed);
router.post("/:id/like", auth, feedController.toggleLikeFeed);
router.post("/:id/bookmark", auth, feedController.toggleBookmark);
router.get("/:id/comments", feedController.getFeedComments);
router.post("/:id/comments", auth, validateRequest(createCommentSchema), feedController.addFeedComment);
router.delete("/:id/comments/:commentId", auth, feedController.deleteFeedComment);
router.delete("/:id", auth, feedController.deleteFeed);

module.exports = router;
