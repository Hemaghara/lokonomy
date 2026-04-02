const express = require("express");
const router = express.Router();
const {
  getAllBusinesses,
  getBusinessDetails,
  deleteContent,
} = require("../../controllers/adminContentController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/businesses", protectAdmin, getAllBusinesses);
router.get("/business/:id", protectAdmin, getBusinessDetails);
router.delete("/delete/:type/:id", protectAdmin, deleteContent);

module.exports = router;
