const express = require("express");
const router = express.Router();
const storyController = require("../controllers/storyController");
const auth = require("../middleware/authMiddleware");
const { checkStoryLimit } = require("../middleware/subscriptionMiddleware");

router.get("/", storyController.getAllStories);
router.get("/:id", storyController.getStoryById);
router.post("/", auth, checkStoryLimit, storyController.createStory);
router.get("/highlights/:ownerId", storyController.getHighlightsByBusiness);
router.delete("/:id", auth, storyController.deleteStory);
router.patch("/:id/like", auth, storyController.toggleLike);
router.patch("/:id/share", storyController.incrementShare);

module.exports = router;
