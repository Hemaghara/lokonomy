import api from "./api";

export const groupService = {
  createGroup: (data) => api.post("/groups", data),
  getGroups: (params) => api.get("/groups", { params }),
  getGroupDetails: (groupId) => api.get(`/groups/${groupId}`),
  joinGroup: (groupId) => api.post(`/groups/${groupId}/join`),
  leaveGroup: (groupId) => api.post(`/groups/${groupId}/leave`),
  createPost: (groupId, content) => api.post(`/groups/${groupId}/posts`, { content }),
  likePost: (postId) => api.post(`/groups/posts/${postId}/like`),
  addComment: (postId, content) => api.post(`/groups/posts/${postId}/comments`, { content }),
};
