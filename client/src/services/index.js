import api from "./api";

export const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  verifyOtp: (data) => api.post("/auth/verify-otp", data),
  register: (userData) => api.post("/auth/register", userData),
  updateProfile: (profileData) => api.put("/auth/update-profile", profileData),
  getMe: () => api.get("/auth/me"),
};

export const businessService = {
  getBusinesses: (params) => api.get("/businesses", { params }),
  getMyBusinesses: () => api.get("/businesses/my"),
  getBusinessById: (id) => api.get(`/businesses/${id}`),
  addBusiness: (businessData) => api.post("/businesses", businessData),
  updateBusiness: (id, businessData) =>
    api.put(`/businesses/${id}`, businessData),
  deleteBusiness: (id) => api.delete(`/businesses/${id}`),
  incrementVisits: (id) => api.post(`/businesses/${id}/visit`),
  addReview: (id, reviewData) =>
    api.post(`/businesses/${id}/review`, reviewData),
};

export const jobService = {
  getJobs: (params) => api.get("/jobs", { params }),
  getMyJobs: () => api.get("/jobs/my"),
  getJobById: (id) => api.get(`/jobs/${id}`),
  createJob: (jobData) => api.post("/jobs", jobData),
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  toggleJobStatus: (id) => api.patch(`/jobs/${id}/status`),
  applyForJob: (id, applicationData) =>
    api.post(`/jobs/${id}/apply`, applicationData),
  getAppliedJobs: () => api.get("/jobs/applied"),
  updateApplicationStatus: (id, applicantId, status) =>
    api.patch(`/jobs/${id}/applications/${applicantId}/status`, { status }),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
};

export const marketService = {
  getProducts: (params) => api.get("/market", { params }),
  getMyProducts: () => api.get("/market/my"),
  getProductById: (id) => api.get(`/market/${id}`),
  addProduct: (productData) => api.post("/market", productData),
  deleteProduct: (id) => api.delete(`/market/${id}`),
};

export const storyService = {
  getStories: (params) => api.get("/stories", { params }),
  getStoryById: (id) => api.get(`/stories/${id}`),
  createStory: (storyData) => api.post("/stories", storyData),
  deleteStory: (id) => api.delete(`/stories/${id}`),
};

export const orderService = {
  createOrder: (orderData) => api.post("/orders", orderData),
  getBuyerOrders: () => api.get("/orders/buyer"),
  getSellerOrders: () => api.get("/orders/seller"),
  getSellerStats: () => api.get("/orders/seller/stats"),
  updateOrderStatus: (id, orderStatus) =>
    api.patch(`/orders/${id}/status`, { orderStatus }),
};

export const feedService = {
  getFeeds: (params) => api.get("/feeds", { params }),
  getFeedById: (id) => api.get(`/feeds/${id}`),
  createFeed: (feedData) => api.post("/feeds", feedData),
  deleteFeed: (id) => api.delete(`/feeds/${id}`),
};
