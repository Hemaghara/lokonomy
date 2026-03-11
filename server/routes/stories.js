const express = require("express");
const router = express.Router();
const storyController = require("../controllers/storyController");
const auth = require("../middleware/authMiddleware");
const { checkStoryLimit } = require("../middleware/subscriptionMiddleware");

router.get("/", storyController.getAllStories);
router.get("/:id", storyController.getStoryById);
router.post("/", auth, checkStoryLimit, storyController.createStory);
router.delete("/:id", auth, storyController.deleteStory);

module.exports = router;
