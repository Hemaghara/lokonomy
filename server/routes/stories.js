const express = require("express");
const router = express.Router();
const storyController = require("../controllers/storyController");
const auth = require("../middleware/authMiddleware");

router.get("/", storyController.getAllStories);
router.get("/:id", storyController.getStoryById);
router.post("/", auth, storyController.createStory);
router.delete("/:id", auth, storyController.deleteStory);

module.exports = router;
