const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/adminModerationController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/moderation/reports", protectAdmin, ctrl.getAllReports);
router.patch("/moderation/reports/:id/resolve", protectAdmin, ctrl.resolveReport);

module.exports = router;
