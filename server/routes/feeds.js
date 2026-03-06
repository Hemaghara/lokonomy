const express = require("express");
const router = express.Router();
const feedController = require("../controllers/feedController");
const auth = require("../middleware/authMiddleware");

router.get("/", feedController.getAllFeeds);
router.get("/:id", feedController.getFeedById);
router.post("/", auth, feedController.createFeed);
router.delete("/:id", auth, feedController.deleteFeed);

module.exports = router;
