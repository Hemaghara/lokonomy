import axios from "axios";

const adminApi = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || (import.meta.env.MODE === "development" 
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
  (error) => Promise.reject(error)
);

export const adminService = {
  login: (credentials) => adminApi.post("/login", credentials),
  register: (adminData) => adminApi.post("/register", adminData),
  getDashboardStats: () => adminApi.get("/dashboard-stats"),
  getUsers: () => adminApi.get("/users"),
  getBusinesses: () => adminApi.get("/businesses"),
  getBusinessDetails: (id) => adminApi.get(`/business/${id}`),
  deleteContent: (type, id) => adminApi.delete(`/delete/${type}/${id}`),
  getUserDetails: (id) => adminApi.get(`/user/${id}`),
  updateUserStatus: (id, status) => adminApi.put(`/user/${id}/status`, { status }),
  verify: () => adminApi.get("/verify"),
  updateProfile: (profileData) => adminApi.put("/profile", profileData),
  getMarketStats: () => adminApi.get("/marketplace/stats"),
  getMarketProducts: (params) => adminApi.get("/marketplace/products", { params }),
  getMarketOrders: (params) => adminApi.get("/marketplace/orders", { params }),
  getMarketAuctions: (params) => adminApi.get("/marketplace/auctions", { params }),
  toggleBanProduct: (id) => adminApi.patch(`/marketplace/products/${id}/ban`),
  toggleSuspendProduct: (id) => adminApi.patch(`/marketplace/products/${id}/suspend`),
  getMarketProductDetails: (id) => adminApi.get(`/marketplace/products/${id}`),
  updateOrderStatus: (id, orderStatus) => adminApi.patch(`/marketplace/orders/${id}/status`, { orderStatus }),
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
  getSubscriptionTransactions: (params) => adminApi.get("/subscriptions/transactions", { params }),
  getRevenueData: (period) => adminApi.get("/subscriptions/revenue", { params: { period } }),
  getFailedPayments: (params) => adminApi.get("/subscriptions/failed-payments", { params }),
  getFinancialReport: (period) => adminApi.get("/subscriptions/financial-report", { params: { period } }),
  sendGlobalNotification: (data) => adminApi.post("/notifications/send-all", data),
  sendPlanNotification: (data) => adminApi.post("/notifications/send-by-plan", data),
  getNotificationHistory: () => adminApi.get("/notifications/history"),
};
