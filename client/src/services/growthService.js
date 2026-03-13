import api from "./api";

export const growthService = {
  // Booking System
  getBookings: (businessId) => api.get(`/growth/bookings/${businessId}`),
  createBooking: (bookingData) => api.post("/growth/bookings", bookingData),
  updateBookingStatus: (data) => api.patch("/growth/bookings/status", data),

  // Business Analytics
  getAnalytics: (businessId) => api.get(`/growth/analytics/${businessId}`),

  // Coupon Manager
  getCoupons: (businessId) => api.get(`/growth/coupons/${businessId}`),
  createCoupon: (couponData) => api.post("/growth/coupons", couponData),
  redeemCoupon: (redeemData) => api.post("/growth/coupons/redeem", redeemData),
};
