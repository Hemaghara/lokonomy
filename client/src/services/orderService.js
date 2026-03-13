import api from "./api";

export const orderService = {
  createOrder: (orderData) => api.post("/orders", orderData),
  getBuyerOrders: () => api.get("/orders/buyer"),
  getSellerOrders: () => api.get("/orders/seller"),
  getSellerStats: () => api.get("/orders/seller/stats"),
  updateOrderStatus: (id, orderStatus) =>
    api.patch(`/orders/${id}/status`, { orderStatus }),
};
