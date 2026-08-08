const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/adminSettingsController");
const { protectAdmin } = require("../../middleware/adminMiddleware");
const validateRequest = require("../../middleware/validateRequest");
const { updateSystemSettingsSchema } = require("../../validators/ops.schema");

router.get("/settings", protectAdmin, ctrl.getSettings);
router.put("/settings", protectAdmin, validateRequest(updateSystemSettingsSchema), ctrl.updateSettings);
router.patch("/settings/maintenance", protectAdmin, ctrl.toggleMaintenanceMode);

module.exports = router;
