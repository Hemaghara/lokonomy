import api from "./api";

export const supportService = {
  getTickets: () => api.get("/support/my-tickets"),
  createTicket: (ticketData) => api.post("/support/create", ticketData),
};
