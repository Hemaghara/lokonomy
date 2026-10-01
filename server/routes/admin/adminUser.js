const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  bulkUpdateUserStatus,
  exportUsers,
} = require("../../controllers/adminUserController");
const { protectAdmin, authorizePermissions } = require("../../middleware/adminMiddleware");

const {
  validateUserStatusUpdate,
  validateBulkStatusUpdate,
} = require("../../middleware/validators/userValidator");

router.get("/users", protectAdmin, authorizePermissions("Users", "User Management"), getAllUsers);
router.get("/users/export", protectAdmin, authorizePermissions("Users", "User Management"), exportUsers);
router.get("/user/:id", protectAdmin, authorizePermissions("Users", "User Management"), getUserDetails);
router.put(
  "/user/:id/status",
  protectAdmin,
  authorizePermissions("Users", "User Management"),
  validateUserStatusUpdate,
  updateUserStatus,
);
router.put(
  "/users/bulk-status",
  protectAdmin,
  authorizePermissions("Users", "User Management"),
  validateBulkStatusUpdate,
  bulkUpdateUserStatus,
);

module.exports = router;
