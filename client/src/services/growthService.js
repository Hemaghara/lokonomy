import api from "./api";

export const growthService = {
  getBookings: (businessId) => api.get(`/growth/bookings/${businessId}`),
  createBooking: (bookingData) => api.post("/growth/bookings", bookingData),
  updateBookingStatus: (data) => api.patch("/growth/bookings/status", data),
  getAnalytics: (businessId) => api.get(`/growth/analytics/${businessId}`),
  getCoupons: (businessId) => api.get(`/growth/coupons/${businessId}`),
  createCoupon: (couponData) => api.post("/growth/coupons", couponData),
  updateCoupon: (couponId, data) => api.put(`/growth/coupons/${couponId}`, data),
  deleteCoupon: (couponId) => api.delete(`/growth/coupons/${couponId}`),
  redeemCoupon: (redeemData) => api.post("/growth/coupons/redeem", redeemData),
  getActiveCoupons: (businessId) => api.get(`/growth/coupons/active/${businessId}`),
  validateCoupon: (data) => api.post("/growth/coupons/validate", data),
};
