import api from "./api";

export const chatService = {
  getMessages: (productId, buyerId, sellerId) =>
    api.get(`/chat/messages/${productId}/${buyerId}/${sellerId}`),
  getConversations: () => api.get("/chat/conversations"),
  getUnreadCount: () => api.get("/chat/unread"),
  markAsRead: (chatRoom) => api.patch(`/chat/read/${chatRoom}`),
};
