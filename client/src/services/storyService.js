import api from "./api";

export const storyService = {
  getStories: (params) => api.get("/stories", { params }),
  getStoryById: (id) => api.get(`/stories/${id}`),
  createStory: (storyData) => api.post("/stories", storyData),
  updateStory: (id, data) => api.put(`/stories/${id}`, data),
  getHighlights: (ownerId) => api.get(`/stories/highlights/${ownerId}`),
  deleteStory: (id) => api.delete(`/stories/${id}`),
  likeStory: (id) => api.patch(`/stories/${id}/like`),
  shareStory: (id) => api.patch(`/stories/${id}/share`),
  addComment: (storyId, data) => api.post(`/stories/${storyId}/comments`, data),
  deleteComment: (storyId, commentId) => api.delete(`/stories/${storyId}/comments/${commentId}`),
  toggleBookmark: (id) => api.patch(`/stories/${id}/bookmark`),
  getSavedStories: () => api.get("/stories/saved/me"),
  votePoll: (storyId, data) => api.patch(`/stories/${storyId}/vote`, data),
  getRelatedStories: (id) => api.get(`/stories/${id}/related`),
  getMyStoryStats: () => api.get("/stories/my/stats"),
  verifyStory: (id, currentState) => api.patch(`/stories/${id}/verify`, { currentState }),
  featureStory: (id, currentState) => api.patch(`/stories/${id}/feature`, { currentState }),
};
