const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getCommissionSummary,
  getSellerCommissions,
  getCommissionRates,
} = require("../controllers/commissionController");


router.get("/rates", getCommissionRates);
router.get("/my-commissions", auth, getSellerCommissions);
router.get("/summary", auth, getCommissionSummary);

module.exports = router;
