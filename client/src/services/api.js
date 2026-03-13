import axios from "axios";

const api = axios.create({
  baseURL: "https://lokonomy.onrender.com/api",
  timeout:30000,
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

export default api;
