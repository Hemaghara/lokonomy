import api from "./api";

const recommendationService = {
  getRecommendations: async () => {
    const res = await api.get("/recommendations");
    return res.data;
  },

  getSuggestions: async (query) => {
    const res = await api.get(`/recommendations/suggestions?q=${query}`);
    return res.data;
  },

  trackInteraction: async (type, itemType, itemId) => {
    const res = await api.post("/recommendations/interaction", {
      type,
      itemType,
      itemId,
    });
    return res.data;
  },
};

export default recommendationService;
