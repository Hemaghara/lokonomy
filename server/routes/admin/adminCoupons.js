const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/adminCouponController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/coupons", protectAdmin, ctrl.getAllCoupons);
router.get("/coupons/:id", protectAdmin, ctrl.getCouponById);
router.post("/coupons", protectAdmin, ctrl.createCoupon);
router.put("/coupons/:id", protectAdmin, ctrl.updateCoupon);
router.delete("/coupons/:id", protectAdmin, ctrl.deleteCoupon);
router.patch("/coupons/:id/toggle-status", protectAdmin, ctrl.toggleCouponStatus);

module.exports = router;
