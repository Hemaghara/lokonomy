import api from "./api";

export const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  verifyOtp: (data) => api.post("/auth/verify-otp", data),
  resendOtp: (email) => api.post("/auth/resend-otp", { email }),
  register: (userData) => api.post("/auth/register", userData),
  updateProfile: (profileData) => api.put("/auth/update-profile", profileData),
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};
