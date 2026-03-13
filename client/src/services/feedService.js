import api from "./api";

export const feedService = {
  getFeeds: (params) => api.get("/feeds", { params }),
  getFeedById: (id) => api.get(`/feeds/${id}`),
  createFeed: (feedData) => api.post("/feeds", feedData),
  deleteFeed: (id) => api.delete(`/feeds/${id}`),
};
