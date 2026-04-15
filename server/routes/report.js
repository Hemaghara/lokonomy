const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, reportController.submitReport);

module.exports = router;
