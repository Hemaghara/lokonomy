const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  verifyAdmin,
  updateAdminProfile,
  reauthAdmin,
} = require("../../controllers/adminAuthController");
const {
  protectAdmin,
  authorizeRoles,
} = require("../../middleware/adminMiddleware");
const { adminLimiter, authLimiter } = require("../../middleware/rateLimiter");

router.post(
  "/register",
  protectAdmin,
  authorizeRoles("superadmin"),
  registerAdmin,
);
router.post("/login", authLimiter, loginAdmin);
router.get("/verify", protectAdmin, verifyAdmin);
router.put("/profile", protectAdmin, updateAdminProfile);
router.post("/reauth", protectAdmin, reauthAdmin);

module.exports = router;
