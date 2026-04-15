const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/adminBookingController");
const { protectAdmin } = require("../../middleware/adminMiddleware");

router.get("/bookings", protectAdmin, ctrl.getAllBookings);
router.get("/bookings/:id", protectAdmin, ctrl.getBookingById);
router.patch("/bookings/:id/status", protectAdmin, ctrl.updateBookingStatus);
router.delete("/bookings/:id", protectAdmin, ctrl.deleteBooking);

module.exports = router;
