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
};
