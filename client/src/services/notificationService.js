import api from "./api";

export const notificationService = {
  getNotifications: (page = 1, limit = 20, type = "all") =>
    api.get(`/notifications?page=${page}&limit=${limit}&type=${type}`),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
  clearAll: () => api.delete("/notifications/clear"),
};
