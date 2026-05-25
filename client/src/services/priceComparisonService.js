import api from "./api";

export const priceComparisonService = {
  comparePrices: (params) => api.get("/pricecomparison", { params }),
};
