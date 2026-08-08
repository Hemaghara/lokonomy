const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const auth = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { submitReportSchema } = require("../validators/ops.schema");

router.post("/", auth, validateRequest(submitReportSchema), reportController.submitReport);

module.exports = router;
