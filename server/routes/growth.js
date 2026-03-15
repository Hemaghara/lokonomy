const express = require("express");
const router = express.Router();
const growthController = require("../controllers/growthController");
const auth = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");

router.get("/analytics/:businessId", auth, growthController.getBusinessAnalytics);
router.get("/coupons/active/:businessId", optionalAuth, growthController.getActiveCoupons);
router.post("/coupons/validate", auth, growthController.validateCoupon);
router.post("/coupons/redeem", auth, growthController.redeemCoupon);
router.post("/coupons", auth, growthController.createCoupon);
router.get("/coupons/:businessId", auth, growthController.getBusinessCoupons);
router.put("/coupons/:couponId", auth, growthController.updateCoupon);
router.delete("/coupons/:couponId", auth, growthController.deleteCoupon);
router.post("/bookings", auth, growthController.createBooking);
router.get("/bookings/:businessId", auth, growthController.getBusinessBookings);
router.patch("/bookings/status", auth, growthController.updateBookingStatus);

module.exports = router;
