import api from "./api";

export const referralService = {
  getMyReferralCode: () => api.get("/referral/my-code"),
  validateReferralCode: (code) => api.get(`/referral/validate/${code}`),
  getReferralLeaderboard: () => api.get("/referral/leaderboard"),
  applyReferralReward: (data) => api.post("/referral/apply-reward", data),
};
