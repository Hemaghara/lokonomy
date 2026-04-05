const express = require("express");
const router = express.Router();
const {
  getSubscriptionTransactions,
  getRevenueData,
  getFailedPayments,
  getFinancialReport,
} = require("../../controllers/adminSubscriptionController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/subscriptions/transactions", protectAdmin, getSubscriptionTransactions);
router.get("/subscriptions/revenue", protectAdmin, getRevenueData);
router.get("/subscriptions/failed-payments", protectAdmin, getFailedPayments);
router.get("/subscriptions/financial-report", protectAdmin, getFinancialReport);

module.exports = router;
