const express = require("express");
const router = express.Router();
const {
  getCampaigns,
  createCampaign,
  sendCampaign,
  deleteCampaign,
  previewSegment,
  markNotificationSeen,
} = require("../../controllers/adminCampaignController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/campaigns", protectAdmin, getCampaigns);
router.post("/campaigns", protectAdmin, createCampaign);
router.post("/campaigns/preview-segment", protectAdmin, previewSegment);
router.post("/campaigns/:id/send", protectAdmin, sendCampaign);
router.delete("/campaigns/:id", protectAdmin, deleteCampaign);
router.patch("/campaigns/notification/:id/seen", protectAdmin, markNotificationSeen);

module.exports = router;
