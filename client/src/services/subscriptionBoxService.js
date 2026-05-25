import api from "./api";

export const subscriptionBoxService = {
  createBox: (data) => api.post("/subscriptionboxes", data),
  getSellerBoxes: () => api.get("/subscriptionboxes/seller"),
  getBusinessBoxes: (businessId) => api.get(`/subscriptionboxes/business/${businessId}`),
  subscribeToBox: (boxId) => api.post(`/subscriptionboxes/${boxId}/subscribe`),
  unsubscribeFromBox: (boxId) => api.post(`/subscriptionboxes/${boxId}/unsubscribe`),
  getMySubscriptions: () => api.get("/subscriptionboxes/my"),
};
