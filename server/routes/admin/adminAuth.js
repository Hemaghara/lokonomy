const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  verifyAdmin,
  updateAdminProfile,
} = require("../../controllers/adminAuthController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/verify", protectAdmin, verifyAdmin);
router.put("/profile", protectAdmin, updateAdminProfile);

module.exports = router;
