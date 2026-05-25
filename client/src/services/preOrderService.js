import api from "./api";

export const preOrderService = {
  createPreOrder: (data) => api.post("/preorders", data),
  getSellerPreOrders: () => api.get("/preorders/seller"),
  getBuyerPreOrders: () => api.get("/preorders/buyer"),
  updatePreOrderStatus: (preOrderId, status) => api.put(`/preorders/${preOrderId}/status`, { status }),
};
