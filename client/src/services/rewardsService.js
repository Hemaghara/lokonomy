import api from "./api";

export const rewardsService = {
  getBalance: () => api.get("/rewards/balance"),
  getOptions: () => api.get("/rewards/options"),
  redeem: (optionId) => api.post("/rewards/redeem", { optionId }),
  claimDailyLogin: () => api.post("/rewards/daily-login"),
};
