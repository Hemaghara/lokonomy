const express = require("express");
const router = express.Router();
const {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  deleteApiKey,
  getApiKeyLogs,
  updateRateLimit,
} = require("../../controllers/adminApiKeyController");
const { protectAdmin, authorizeRoles } = require("../../middleware/adminMiddleware");

router.get("/api-keys", protectAdmin, getApiKeys);
router.post("/api-keys", protectAdmin, authorizeRoles("superadmin", "admin"), createApiKey);
router.patch("/api-keys/:id/revoke", protectAdmin, revokeApiKey);
router.delete("/api-keys/:id", protectAdmin, authorizeRoles("superadmin"), deleteApiKey);
router.get("/api-keys/:id/logs", protectAdmin, getApiKeyLogs);
router.put("/api-keys/:id/rate-limit", protectAdmin, updateRateLimit);

module.exports = router;
