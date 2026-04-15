const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/adminSettingsController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/settings", protectAdmin, ctrl.getSettings);
router.put("/settings", protectAdmin, ctrl.updateSettings);
router.patch("/settings/maintenance", protectAdmin, ctrl.toggleMaintenanceMode);

module.exports = router;
