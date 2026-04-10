const express = require("express");
const router = express.Router();
const {
  getSubAdmins,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  getActivityLogs,
  resetPassword,
} = require("../../controllers/adminSubAdminController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/sub-admins", protectAdmin, getSubAdmins);
router.post("/sub-admins", protectAdmin, createSubAdmin);
router.put("/sub-admins/:id", protectAdmin, updateSubAdmin);
router.delete("/sub-admins/:id", protectAdmin, deleteSubAdmin);
router.get("/sub-admins/logs", protectAdmin, getActivityLogs);
router.put("/sub-admins/:id/reset-password", protectAdmin, resetPassword);

module.exports = router;
