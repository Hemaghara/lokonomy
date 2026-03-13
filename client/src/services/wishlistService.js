import api from "./api";

export const wishlistService = {
  toggleWishlist: (type, id) =>
    api.post("/wishlist/toggle", { type, id }).then((res) => res.data),
  getWishlist: () => api.get("/wishlist").then((res) => res.data),
  checkWishlistStatus: (type, id) =>
    api.get(`/wishlist/status/${type}/${id}`).then((res) => res.data),
};
