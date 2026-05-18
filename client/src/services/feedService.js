import api from "./api";

export const feedService = {
  getFeeds: (params) => api.get("/feeds", { params }),
  getFeedById: (id) => api.get(`/feeds/${id}`),
  createFeed: (feedData) => api.post("/feeds", feedData),
  updateFeed: (id, feedData) => api.put(`/feeds/${id}`, feedData),
  deleteFeed: (id) => api.delete(`/feeds/${id}`),
  toggleLikeFeed: (id) => api.post(`/feeds/${id}/like`),
  addComment: (id, text) => api.post(`/feeds/${id}/comments`, { text }),
  deleteComment: (id, commentId) => api.delete(`/feeds/${id}/comments/${commentId}`),
};
