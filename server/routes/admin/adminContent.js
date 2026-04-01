const express = require("express");
const router = express.Router();
const {
  getAllBusinesses,
  deleteContent,
} = require("../../controllers/adminContentController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/businesses", protectAdmin, getAllBusinesses);
router.delete("/delete/:type/:id", protectAdmin, deleteContent);

module.exports = router;
