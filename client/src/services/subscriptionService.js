import api from "./api";

export const subscriptionService = {
  getPlans: () => api.get("/subscription/plans"),
  createOrder: (plan, durationMonths) =>
    api.post("/subscription/create-order", { plan, durationMonths }),
  verifyPayment: (data) => api.post("/subscription/verify-payment", data),
  getStatus: () => api.get("/subscription/status"),
};
