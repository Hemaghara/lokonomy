import api from "./api";

export const aiInsightsService = {
  getAIInsights: (businessId) => api.get(`/aiinsights/${businessId}`),
};
