import api from "./api";

export const influencerService = {
  voteHelpful: (reviewerId, businessId, reviewId) => 
    api.post("/influencer/vote-helpful", { reviewerId, businessId, reviewId }),
  getLocalInfluencers: (params) => 
    api.get("/influencer/local", { params }),
  updateStatus: () => 
    api.post("/influencer/update-status"),
};
