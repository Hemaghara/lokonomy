import api from "./api";

export const storyService = {
  getStories: (params) => api.get("/stories", { params }),
  getStoryById: (id) => api.get(`/stories/${id}`),
  createStory: (storyData) => api.post("/stories", storyData),
  deleteStory: (id) => api.delete(`/stories/${id}`),
};
