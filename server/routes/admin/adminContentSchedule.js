const express = require("express");
const router = express.Router();
const {
  getScheduledContent,
  scheduleStory,
  togglePinFeed,
  scheduleFeed,
} = require("../../controllers/adminContentScheduleController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/content-schedule", protectAdmin, getScheduledContent);
router.patch(
  "/content-schedule/story/:id/schedule",
  protectAdmin,
  scheduleStory,
);
router.patch("/content-schedule/feed/:id/pin", protectAdmin, togglePinFeed);
router.patch("/content-schedule/feed/:id/schedule", protectAdmin, scheduleFeed);

module.exports = router;
