import axios from "axios";
import { toast } from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : (import.meta.env.MODE === "development"
      ? "http://localhost:5000/api"
      : "https://lokonomy.onrender.com/api"),
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const impersonationToken = localStorage.getItem("impersonationToken");

    let user = null;
    try {
      const savedUser = localStorage.getItem("lokonomy_user");
      user = savedUser ? JSON.parse(savedUser) : null;
    } catch (err) {
      
    }

    const adminToken = localStorage.getItem("adminToken");

    if (impersonationToken && !window.location.pathname.startsWith("/admin")) {
      config.headers.Authorization = `Bearer ${impersonationToken}`;
      config._tokenType = "impersonation";
    }
    else if (window.location.pathname.startsWith("/admin") && !config.url?.includes("/auth/me")) {
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
        config._tokenType = "admin";
      }
    }
    else if (user && user.token) {
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
  async (error) => {
    const status = error.response ? error.response.status : null;
    const message = error.response?.data?.message || error.message || "An unexpected error occurred";
    const tokenType = error.config?._tokenType;
    const originalRequest = error.config;

    if (status === 401 && !originalRequest._retry && tokenType === "user" && !originalRequest.url?.includes("/auth/refresh")) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      let user = null;
      try {
        const savedUser = localStorage.getItem("lokonomy_user");
        user = savedUser ? JSON.parse(savedUser) : null;
      } catch (err) {  }

      const refreshToken = user?.refreshToken;
      if (refreshToken) {
        try {
          const res = await axios.post(api.defaults.baseURL + "/auth/refresh", { refreshToken });
          const { token: newAccessToken, refreshToken: newRefreshToken } = res.data;

          const updatedUser = { ...user, token: newAccessToken, refreshToken: newRefreshToken };
          localStorage.setItem("lokonomy_user", JSON.stringify(updatedUser));

          window.dispatchEvent(new Event("storage"));

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return api(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          localStorage.removeItem("lokonomy_user");
          if (!window.location.pathname.startsWith("/admin") &&
            !window.location.pathname.startsWith("/login") &&
            window.location.pathname !== "/") {
            window.location.href = "/?expired=true";
          }
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
    }

    if (status === 401) {
      if (tokenType === "admin") {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");

        if (window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
          window.location.href = "/admin/login?expired=true";
        }
      } else if (tokenType === "impersonation") {
        localStorage.removeItem("impersonationToken");
        localStorage.removeItem("impersonatedUser");
        toast.error("Impersonation session expired.");
        window.location.href = "/admin/users";
      } else {
        localStorage.removeItem("lokonomy_user");

        if (!window.location.pathname.startsWith("/admin") &&
          !window.location.pathname.startsWith("/login") &&
          window.location.pathname !== "/") {
          window.location.href = "/?expired=true";
        }
      }
    } else if (status === 403) {
      toast.error("You do not have permission to perform this action.");
    } else if (status === 404) {
      console.error("Resource not found:", message);
    } else if (status >= 500) {
      toast.error("Server error. Please try again later.");
    } else if (!status) {
      toast.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  },
);

export default api;
