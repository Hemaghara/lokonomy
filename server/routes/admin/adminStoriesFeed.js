const express = require("express");
const router = express.Router();
const {
  getStoriesFeedStats,
  getStories,
  getFeeds,
  getStoryDetails,
  getFeedDetails,
  deleteStory,
  deleteFeed,
} = require("../../controllers/adminStoriesFeedController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/stories-feed/stats", protectAdmin, getStoriesFeedStats);
router.get("/stories-feed/stories", protectAdmin, getStories);
router.get("/stories-feed/feeds", protectAdmin, getFeeds);
router.get("/stories-feed/story/:id", protectAdmin, getStoryDetails);
router.get("/stories-feed/feed/:id", protectAdmin, getFeedDetails);
router.delete("/stories-feed/story/:id", protectAdmin, deleteStory);
router.delete("/stories-feed/feed/:id", protectAdmin, deleteFeed);

module.exports = router;
