import api from "./api";

export const leaderboardService = {
  getLeaderboard: (params) => api.get("/leaderboard", { params }),
  getBusinessRanking: (businessId) => api.get(`/leaderboard/business/${businessId}`),
  calculateLeaderboard: () => api.post("/leaderboard/calculate"),
};

