const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  bulkUpdateUserStatus,
  exportUsers,
} = require("../../controllers/adminUserController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/users", protectAdmin, getAllUsers);
router.get("/users/export", protectAdmin, exportUsers);
router.get("/user/:id", protectAdmin, getUserDetails);
router.put("/user/:id/status", protectAdmin, updateUserStatus);
router.put("/users/bulk-status", protectAdmin, bulkUpdateUserStatus);

module.exports = router;
