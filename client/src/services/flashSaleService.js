import api from "./api";

export const flashSaleService = {
  createFlashSale: (data) => api.post("/flashsales", data),
  getFlashSales: () => api.get("/flashsales"),
  getSellerFlashSales: () => api.get("/flashsales/seller"),
  cancelFlashSale: (id) => api.put(`/flashsales/${id}/cancel`),
};
