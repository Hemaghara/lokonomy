const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/adminAuditController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/audit-logs", protectAdmin, ctrl.getAuditLogs);

module.exports = router;
