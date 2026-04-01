const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserDetails,
  updateUserStatus,
} = require("../../controllers/adminUserController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/users", protectAdmin, getAllUsers);
router.get("/user/:id", protectAdmin, getUserDetails);
router.put("/user/:id/status", protectAdmin, updateUserStatus);

module.exports = router;
