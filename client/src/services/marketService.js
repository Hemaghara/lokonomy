import api from "./api";

export const marketService = {
  getProducts: (params) => api.get("/market", { params }),
  getMyProducts: () => api.get("/market/my"),
  getProductById: (id) => api.get(`/market/${id}`),
  addProduct: (productData) => api.post("/market", productData),
  deleteProduct: (id) => api.delete(`/market/${id}`),
  addProductReview: (id, reviewData) =>
    api.post(`/market/${id}/review`, reviewData),
};
