import api from "./api";

export const promotedService = {
  createPromotion: (data) => api.post("/promoted", data),
  getBusinessPromotions: (businessId) => api.get(`/promoted/business/${businessId}`),
  trackImpression: (promotionId) => api.post(`/promoted/${promotionId}/impression`),
  trackClick: (promotionId) => api.post(`/promoted/${promotionId}/click`),
};
