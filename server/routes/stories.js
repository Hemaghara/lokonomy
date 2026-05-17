const express = require("express");
const router = express.Router();
const storyController = require("../controllers/storyController");
const auth = require("../middleware/authMiddleware");
const { checkStoryLimit } = require("../middleware/subscriptionMiddleware");

router.get("/", storyController.getAllStories);
router.get("/saved/me", auth, storyController.getSavedStories);
router.get("/my/stats", auth, storyController.getMyStoryStats);
router.get("/:id", storyController.getStoryById);
router.post("/", auth, checkStoryLimit, storyController.createStory);
router.put("/:id", auth, storyController.updateStory);
router.delete("/:id", auth, storyController.deleteStory);
router.get("/highlights/:ownerId", storyController.getHighlightsByBusiness);
router.patch("/:id/like", auth, storyController.toggleLike);
router.patch("/:id/share", storyController.incrementShare);
router.patch("/:id/bookmark", auth, storyController.toggleBookmark);
router.post("/:id/comments", auth, storyController.addComment);
router.delete("/:id/comments/:commentId", auth, storyController.deleteComment);
router.patch("/:id/vote", auth, storyController.votePoll);
router.get("/:id/related", storyController.getRelatedStories);
router.patch("/:id/verify", auth, storyController.verifyStory);
router.patch("/:id/feature", auth, storyController.featureStory);
router.delete("/:id/comments/:commentId/admin", auth, storyController.adminDeleteComment);

module.exports = router;
