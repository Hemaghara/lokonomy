import api from "./api";

export const businessService = {
  getBusinesses: (params) => api.get("/businesses", { params }),
  getMyBusinesses: () => api.get("/businesses/my"),
  getBusinessById: (id) => api.get(`/businesses/${id}`),
  addBusiness: (businessData) => api.post("/businesses", businessData),
  updateBusiness: (id, businessData) =>
    api.put(`/businesses/${id}`, businessData),
  deleteBusiness: (id) => api.delete(`/businesses/${id}`),
  incrementVisits: (id) => api.post(`/businesses/${id}/visit`),
  addReview: (id, reviewData) =>
    api.post(`/businesses/${id}/review`, reviewData),
};
