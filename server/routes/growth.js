const express = require("express");
const router = express.Router();
const growthController = require("../controllers/growthController");
const auth = require("../middleware/authMiddleware");

// Analytics
router.get("/analytics/:businessId", auth, growthController.getBusinessAnalytics);

// Coupons
router.post("/coupons", auth, growthController.createCoupon);
router.get("/coupons/:businessId", growthController.getBusinessCoupons);
router.post("/coupons/redeem", auth, growthController.redeemCoupon);

// Bookings
router.post("/bookings", auth, growthController.createBooking);
router.get("/bookings/:businessId", auth, growthController.getBusinessBookings);
router.patch("/bookings/status", auth, growthController.updateBookingStatus);

module.exports = router;
