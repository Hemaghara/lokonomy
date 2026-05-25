import api from "./api";

export const guaranteeService = {
  fileClaim: (data) => api.post("/guarantee", data),
  getMyClaims: () => api.get("/guarantee/my"),
  getClaimStatus: (id) => api.get(`/guarantee/${id}`),
};
