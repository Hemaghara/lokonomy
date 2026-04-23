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

const {
  validateUserStatusUpdate,
  validateBulkStatusUpdate,
} = require("../../middleware/validators/userValidator");

router.get("/users", protectAdmin, getAllUsers);
router.get("/users/export", protectAdmin, exportUsers);
router.get("/user/:id", protectAdmin, getUserDetails);
router.put(
  "/user/:id/status",
  protectAdmin,
  validateUserStatusUpdate,
  updateUserStatus,
);
router.put(
  "/users/bulk-status",
  protectAdmin,
  validateBulkStatusUpdate,
  bulkUpdateUserStatus,
);

module.exports = router;
