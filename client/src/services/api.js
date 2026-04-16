import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5000/api"
      : "https://lokonomy.onrender.com/api",
});
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("lokonomy_user"));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("lokonomy_user");

      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
