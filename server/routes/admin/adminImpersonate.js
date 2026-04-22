const express = require("express");
const router = express.Router();
const { impersonateUser, verifyImpersonation } = require("../../controllers/adminImpersonateController");
const { protectAdmin, authorizeRoles } = require("../../middleware/adminMiddleware");

router.post("/impersonate/:userId", protectAdmin, authorizeRoles("superadmin"), impersonateUser);
router.get("/impersonate/verify", verifyImpersonation);

module.exports = router;
