const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/adminVerificationController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/verification/pending", protectAdmin, ctrl.getPendingVerifications);
router.get("/verification/:id", protectAdmin, ctrl.getBusinessForVerification);
router.patch("/verification/:id/approve", protectAdmin, ctrl.approveBusiness);
router.patch("/verification/:id/reject", protectAdmin, ctrl.rejectBusiness);
router.patch("/verification/:id/mark-review", protectAdmin, ctrl.markUnderReview);

module.exports = router;
