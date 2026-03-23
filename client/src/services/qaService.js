import api from "./api";

export const qaService = {
  getQuestions: (businessId) => api.get(`/qa/${businessId}`),
  postQuestion: (businessId, question) =>
    api.post(`/qa/${businessId}`, { question }),
  postAnswer: (businessId, questionId, answer) =>
    api.post(`/qa/${businessId}/${questionId}/answer`, { answer }),
  deleteQuestion: (questionId) => api.delete(`/qa/${questionId}`),
  upvoteQuestion: (questionId) => api.patch(`/qa/${questionId}/upvote`),
};
