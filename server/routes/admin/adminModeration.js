const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/adminModerationController");
const { protectAdmin } = require("../../middleware/adminMiddleware");
const validateRequest = require("../../middleware/validateRequest");
const { resolveReportSchema } = require("../../validators/ops.schema");

router.get("/moderation/reports", protectAdmin, ctrl.getAllReports);
router.get(
  "/moderation/reports/:id/content",
  protectAdmin,
  ctrl.getReportedContent,
);
router.patch(
  "/moderation/reports/:id/resolve",
  protectAdmin,
  validateRequest(resolveReportSchema),
  ctrl.resolveReport,
);

module.exports = router;
