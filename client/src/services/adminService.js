import axios from "axios";

const adminApi = axios.create({
  baseURL:
    (import.meta.env.VITE_API_URL ||
      (import.meta.env.MODE === "development"
        ? "http://localhost:5000"
        : "https://lokonomy.onrender.com")) + "/api/admin",
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
      if (window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  },
);

export const adminService = {
  login: (credentials) => adminApi.post("/login", credentials),
  register: (adminData) => adminApi.post("/register", adminData),
  getDashboardStats: (params) => adminApi.get("/dashboard-stats", { params }),
  getOnlineTrend: () => adminApi.get("/online-trend"),
  getUsers: (params) => adminApi.get("/users", { params }),
  getBusinesses: () => adminApi.get("/businesses"),
  getBusinessDetails: (id) => adminApi.get(`/business/${id}`),
  deleteContent: (type, id) => adminApi.delete(`/delete/${type}/${id}`),
  getUserDetails: (id) => adminApi.get(`/user/${id}`),
  updateUserStatus: (id, status) =>
    adminApi.put(`/user/${id}/status`, { status }),
  bulkUpdateUserStatus: (ids, status) =>
    adminApi.put("/users/bulk-status", { ids, status }),
  exportUsersCSV: (params) =>
    adminApi.get("/users/export", { params, responseType: "blob" }),
  verify: () => adminApi.get("/verify"),
  reauth: (password) => adminApi.post("/reauth", { password }),
  updateProfile: (profileData) => adminApi.put("/profile", profileData),
  getMarketStats: () => adminApi.get("/marketplace/stats"),
  getMarketProducts: (params) =>
    adminApi.get("/marketplace/products", { params }),
  getMarketOrders: (params) => adminApi.get("/marketplace/orders", { params }),
  getMarketAuctions: (params) =>
    adminApi.get("/marketplace/auctions", { params }),
  toggleBanProduct: (id) => adminApi.patch(`/marketplace/products/${id}/ban`),
  toggleSuspendProduct: (id) =>
    adminApi.patch(`/marketplace/products/${id}/suspend`),
  getMarketProductDetails: (id) => adminApi.get(`/marketplace/products/${id}`),
  updateOrderStatus: (id, orderStatus) =>
    adminApi.patch(`/marketplace/orders/${id}/status`, { orderStatus }),
  getMarketOrderDetails: (id) => adminApi.get(`/marketplace/orders/${id}`),
  getJobStats: () => adminApi.get("/jobs/stats"),
  getJobs: (params) => adminApi.get("/jobs", { params }),
  getJobDetails: (id) => adminApi.get(`/jobs/${id}`),
  toggleBanJob: (id) => adminApi.patch(`/jobs/${id}/ban`),
  toggleSuspendJob: (id) => adminApi.patch(`/jobs/${id}/suspend`),
  getJobPosterUsage: (userId) => adminApi.get(`/jobs/user/${userId}/usage`),
  getStoriesFeedStats: () => adminApi.get("/stories-feed/stats"),
  getStories: (params) => adminApi.get("/stories-feed/stories", { params }),
  getFeeds: (params) => adminApi.get("/stories-feed/feeds", { params }),
  deleteStory: (id) => adminApi.delete(`/stories-feed/story/${id}`),
  deleteFeed: (id) => adminApi.delete(`/stories-feed/feed/${id}`),
  getStoryDetails: (id) => adminApi.get(`/stories-feed/story/${id}`),
  getFeedDetails: (id) => adminApi.get(`/stories-feed/feed/${id}`),
  verifyStory: (id, currentState) => adminApi.patch(`/stories-feed/story/${id}/verify`, { currentState }),
  featureStory: (id, currentState) => adminApi.patch(`/stories-feed/story/${id}/feature`, { currentState }),
  updateStory: (id, data) => adminApi.put(`/stories-feed/story/${id}`, data),
  adminDeleteComment: (storyId, commentId) => adminApi.delete(`/stories-feed/story/${storyId}/comments/${commentId}/admin`),
  getSubscriptionTransactions: (params) =>
    adminApi.get("/subscriptions/transactions", { params }),
  getRevenueData: (period) =>
    adminApi.get("/subscriptions/revenue", { params: { period } }),
  getFailedPayments: (params) =>
    adminApi.get("/subscriptions/failed-payments", { params }),
  getFinancialReport: (period) =>
    adminApi.get("/subscriptions/financial-report", { params: { period } }),
  exportSubscriptionTransactions: (params) =>
    adminApi.get("/subscriptions/export", { params, responseType: "blob" }),
  sendGlobalNotification: (data) =>
    adminApi.post("/notifications/send-all", data),
  sendPlanNotification: (data) =>
    adminApi.post("/notifications/send-by-plan", data),
  getNotificationHistory: () => adminApi.get("/notifications/history"),
  scheduleNotification: (data) =>
    adminApi.post("/notifications/schedule", data),
  getScheduledNotifications: () => adminApi.get("/notifications/scheduled"),
  cancelScheduledNotification: (id) =>
    adminApi.delete(`/notifications/scheduled/${id}`),
  getBusinessReviews: (params) => adminApi.get("/reviews/business", { params }),
  getProductReviews: (params) => adminApi.get("/reviews/product", { params }),
  deleteBusinessReview: (businessId, reviewId) =>
    adminApi.delete(`/reviews/business/${businessId}/${reviewId}`),
  deleteProductReview: (productId, reviewId) =>
    adminApi.delete(`/reviews/product/${productId}/${reviewId}`),
  getBusinessReviewAnalytics: (businessId) =>
    adminApi.get(`/reviews/analytics/${businessId}`),
  getRewardsStats: () => adminApi.get("/rewards/stats"),
  getLoyaltyBalances: (params) =>
    adminApi.get("/rewards/loyalty-balances", { params }),
  updateLoyaltyPoints: (userId, data) =>
    adminApi.put(`/rewards/loyalty-balances/${userId}`, data),
  getRedemptionHistory: (params) =>
    adminApi.get("/rewards/redemption-history", { params }),
  getAllReferrals: (params) => adminApi.get("/referrals/all", { params }),
  getTopReferrers: () => adminApi.get("/referrals/top"),
  getReferralLeaderboard: (params) =>
    adminApi.get("/referrals/leaderboard", { params }),
  getAnalyticsOverview: () => adminApi.get("/analytics/overview"),
  getUserGrowth: (period) =>
    adminApi.get("/analytics/users", { params: { period } }),
  getBusinessGrowth: (period) =>
    adminApi.get("/analytics/businesses", { params: { period } }),
  getJobTrends: (period) =>
    adminApi.get("/analytics/jobs", { params: { period } }),
  getRevenueTrends: (period) =>
    adminApi.get("/analytics/revenue", { params: { period } }),
  getRegionStats: () => adminApi.get("/analytics/regions"),
  getSubAdmins: (params) => adminApi.get("/sub-admins", { params }),
  getSubAdminById: (id) => adminApi.get(`/sub-admins/${id}`),
  createSubAdmin: (data) => adminApi.post("/sub-admins", data),
  updateSubAdmin: (id, data) => adminApi.put(`/sub-admins/${id}`, data),
  deleteSubAdmin: (id) => adminApi.delete(`/sub-admins/${id}`),
  getAdminActivityLogs: () => adminApi.get("/sub-admins/logs"),
  resetSubAdminPassword: (id, password) =>
    adminApi.put(`/sub-admins/${id}/reset-password`, { password }),
  globalSearch: (query) => adminApi.get("/search", { params: { query } }),
  getCoupons: (params) => adminApi.get("/coupons", { params }),
  getCouponById: (id) => adminApi.get(`/coupons/${id}`),
  createCoupon: (data) => adminApi.post("/coupons", data),
  updateCoupon: (id, data) => adminApi.put(`/coupons/${id}`, data),
  deleteCoupon: (id) => adminApi.delete(`/coupons/${id}`),
  toggleCouponStatus: (id) => adminApi.patch(`/coupons/${id}/toggle-status`),
  getSupportTickets: (params) => adminApi.get("/support/tickets", { params }),
  getTicketById: (id) => adminApi.get(`/support/tickets/${id}`),
  updateTicketStatus: (id, status) =>
    adminApi.patch(`/support/tickets/${id}/status`, { status }),
  assignTicket: (id, adminId) =>
    adminApi.patch(`/support/tickets/${id}/assign`, { adminId }),
  replyToTicket: (id, message) =>
    adminApi.post(`/support/tickets/${id}/reply`, { message }),
  updateTicketPriority: (id, priority) =>
    adminApi.patch(`/support/tickets/${id}/priority`, { priority }),
  getBookings: (params) => adminApi.get("/bookings", { params }),
  getBookingById: (id) => adminApi.get(`/bookings/${id}`),
  updateBookingStatus: (id, status) =>
    adminApi.patch(`/bookings/${id}/status`, { status }),
  deleteBooking: (id) => adminApi.delete(`/bookings/${id}`),
  getPendingVerifications: (params) =>
    adminApi.get("/verification/pending", { params }),
  getBusinessForVerification: (id) => adminApi.get(`/verification/${id}`),
  approveBusiness: (id) => adminApi.patch(`/verification/${id}/approve`),
  rejectBusiness: (id, reason) =>
    adminApi.patch(`/verification/${id}/reject`, { reason }),
  markVerificationUnderReview: (id) =>
    adminApi.patch(`/verification/${id}/mark-review`),
  getPlatformSettings: () => adminApi.get("/settings"),
  updatePlatformSettings: (data) => adminApi.put("/settings", data),
  toggleMaintenanceMode: () => adminApi.patch("/settings/maintenance"),
  getAuditLogs: (params) => adminApi.get("/audit-logs", { params }),
  getQA: (params) => adminApi.get("/qa", { params }),
  deleteQuestion: (id) => adminApi.delete(`/qa/${id}`),
  deleteAnswer: (id, answerId) =>
    adminApi.delete(`/qa/${id}/answer/${answerId}`),
  togglePinQA: (id) => adminApi.patch(`/qa/${id}/pin`),
  getModerationReports: (params) =>
    adminApi.get("/moderation/reports", { params }),
  resolveReport: (id, data) =>
    adminApi.patch(`/moderation/reports/${id}/resolve`, data),
  getReportedContent: (id) => adminApi.get(`/moderation/reports/${id}/content`),
  getChatStats: () => adminApi.get("/chats/stats"),
  getReportedChats: () => adminApi.get("/chats/reported"),
  getConversation: (chatRoom) =>
    adminApi.get(`/chats/conversation/${chatRoom}`),
  exportExcel: (type) =>
    adminApi.get(`/reports/export/${type}`, { responseType: "blob" }),
  getHealthStatus: () => adminApi.get("/health"),
  impersonateUser: (userId) => adminApi.post(`/impersonate/${userId}`),
  getAlerts: () => adminApi.get("/alerts"),
  getFraudSignals: () => adminApi.get("/fraud/signals"),
  getUserRiskScore: (id) => adminApi.get(`/fraud/user/${id}/risk`),
  getBusinessScore: (id) => adminApi.get(`/fraud/business/${id}/score`),
  getCampaigns: () => adminApi.get("/campaigns"),
  createCampaign: (data) => adminApi.post("/campaigns", data),
  sendCampaign: (id) => adminApi.post(`/campaigns/${id}/send`),
  deleteCampaign: (id) => adminApi.delete(`/campaigns/${id}`),
  previewSegment: (segment) =>
    adminApi.post("/campaigns/preview-segment", { segment }),
  getHeatmapData: (days) => adminApi.get("/heatmap", { params: { days } }),
  getChurnData: (days) => adminApi.get("/churn", { params: { days } }),
  sendRenewalReminder: (userId) => adminApi.post(`/churn/remind/${userId}`),
  getApiKeys: () => adminApi.get("/api-keys"),
  createApiKey: (data) => adminApi.post("/api-keys", data),
  revokeApiKey: (id) => adminApi.patch(`/api-keys/${id}/revoke`),
  deleteApiKey: (id) => adminApi.delete(`/api-keys/${id}`),
  getApiKeyLogs: (id) => adminApi.get(`/api-keys/${id}/logs`),
  updateApiKeyRateLimit: (id, rateLimit) =>
    adminApi.put(`/api-keys/${id}/rate-limit`, { rateLimit }),
  getScheduledContent: () => adminApi.get("/content-schedule"),
  scheduleStory: (id, data) =>
    adminApi.patch(`/content-schedule/story/${id}/schedule`, data),
  togglePinFeed: (id) => adminApi.patch(`/content-schedule/feed/${id}/pin`),
  scheduleFeed: (id, data) =>
    adminApi.patch(`/content-schedule/feed/${id}/schedule`, data),
};
