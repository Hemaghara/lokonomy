import api from "./api";

export const jobService = {
  getJobs: (params) => api.get("/jobs", { params }),
  getMyJobs: () => api.get("/jobs/my"),
  getJobById: (id) => api.get(`/jobs/${id}`),
  createJob: (jobData) => api.post("/jobs", jobData),
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  toggleJobStatus: (id) => api.patch(`/jobs/${id}/status`),
  applyForJob: (id, applicationData) =>
    api.post(`/jobs/${id}/apply`, applicationData),
  getAppliedJobs: () => api.get("/jobs/applied"),
  updateApplicationStatus: (id, applicantId, status) =>
    api.patch(`/jobs/${id}/applications/${applicantId}/status`, { status }),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
};
