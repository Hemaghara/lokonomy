import api from "./api";

export const commissionService = {
  getRates: () => api.get("/commissions/rates"),
  getMyCommissions: () => api.get("/commissions/my-commissions"),
  getSummary: (params) => api.get("/commissions/summary", { params }),
};

