import axios from "axios";
import { toast } from "react-hot-toast";

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5000/api"
      : "https://lokonomy.onrender.com/api",
});

api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("lokonomy_user"));
    const adminToken = localStorage.getItem("adminToken");

    // Use adminToken if we're on an admin path, UNLESS it's a specific user auth endpoint
    // This prevents background user session checks from using the admin token
    if (window.location.pathname.startsWith("/admin") && !config.url?.includes("/auth/me")) {
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
        config._tokenType = "admin";
      }
    } else if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
      config._tokenType = "user";
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const message = error.response?.data?.message || error.message || "An unexpected error occurred";
    const tokenType = error.config?._tokenType;

    if (status === 401) {
      if (tokenType === "admin") {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
        
        // Only redirect to admin login if we are actually in the admin panel
        if (window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
          toast.error("Admin session expired. Please login again.");
          window.location.href = "/admin/login";
        }
      } else {
        localStorage.removeItem("lokonomy_user");
        
        // Only redirect to user login if we are in the user area (not admin panel)
        if (!window.location.pathname.startsWith("/admin") && 
            !window.location.pathname.startsWith("/login") && 
            window.location.pathname !== "/") {
          toast.error("Session expired. Please login again.");
          window.location.href = "/";
        }
      }
    } else if (status === 403) {
      toast.error("You do not have permission to perform this action.");
    } else if (status === 404) {
      console.error("Resource not found:", message);
    } else if (status === 429) {
      toast.error("Too many requests. Please slow down.");
    } else if (status >= 500) {
      toast.error("Server error. Please try again later.");
    } else if (!status) {
      toast.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  },
);

export default api;

