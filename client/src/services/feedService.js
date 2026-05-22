import api from "./api";

export const feedService = {
  getFeeds: (params) => api.get("/feeds", { params }),
  getFeedById: (id) => api.get(`/feeds/${id}`),
  createFeed: (feedData) => api.post("/feeds", feedData),
  updateFeed: (id, feedData) => api.put(`/feeds/${id}`, feedData),
  deleteFeed: (id) => api.delete(`/feeds/${id}`),
  toggleLikeFeed: (id) => api.post(`/feeds/${id}/like`),
  toggleBookmark: (id) => api.post(`/feeds/${id}/bookmark`),
  getComments: (id, page = 1, limit = 20) => api.get(`/feeds/${id}/comments?page=${page}&limit=${limit}`),
  addComment: (id, text) => api.post(`/feeds/${id}/comments`, { text }),
  deleteComment: (id, commentId) => api.delete(`/feeds/${id}/comments/${commentId}`),
  getTrendingFeeds: (params) => api.get("/feeds/trending", { params }),
  getRelatedFeeds: (id, params) => api.get(`/feeds/${id}/related`, { params }),
};
