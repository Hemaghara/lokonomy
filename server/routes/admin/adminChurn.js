const express = require("express");
const router = express.Router();
const { getChurnData, sendRenewalReminder } = require("../../controllers/adminChurnController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/churn", protectAdmin, getChurnData);
router.post("/churn/remind/:userId", protectAdmin, sendRenewalReminder);

module.exports = router;
