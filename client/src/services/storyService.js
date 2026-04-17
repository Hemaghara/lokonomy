import api from "./api";

export const storyService = {
  getStories: (params) => api.get("/stories", { params }),
  getStoryById: (id) => api.get(`/stories/${id}`),
  createStory: (storyData) => api.post("/stories", storyData),
  getHighlights: (ownerId) => api.get(`/stories/highlights/${ownerId}`),
  deleteStory: (id) => api.delete(`/stories/${id}`),
  likeStory: (id) => api.patch(`/stories/${id}/like`),
  shareStory: (id) => api.patch(`/stories/${id}/share`),
};
