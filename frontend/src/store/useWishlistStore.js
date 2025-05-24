import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./useAuthStore"; // ✅ Get token from auth store

const useWishlistStore = create((set) => ({
  wishlist: [],
  selectedProductId: null, // ✅ Store selected product ID
  loading: false,

  // ✅ Set Product ID in Store
  setSelectedProductId: (productId) => set({ selectedProductId: productId }),

  // ✅ Fetch wishlist from backend
  fetchWishlist: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return; // Prevent API call if user is not logged in

    try {
      set({ loading: true });
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/get-wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ wishlist: response?.data?.products || [] }); // ✅ Ensure we store products array
    } catch (error) {
      console.error("Error fetching wishlist:", error?.message);
    } finally {
      set({ loading: false });
    }
  },

  // ✅ Add Item to Wishlist
  addToWishlist: async (product) => {
    const token = useAuthStore.getState().token;
    if (!token) return alert("Please log in to add items to your wishlist!");

    try {
      set({ loading: true });
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/add-wishlist`,
        { productId: product._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      set((state) => ({
        wishlist: [...state.wishlist, product], // ✅ Add to local state
      }));
    } catch (error) {
      console.error("Error adding to wishlist:", error);
    } finally {
      set({ loading: false });
    }
  },

  // ✅ Remove Item from Wishlist
  removeFromWishlist: async (productId) => {
    const token = useAuthStore.getState().token;
    if (!token) return alert("Please log in to manage your wishlist!");

    try {
      set({ loading: true });
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/remove-wishlist`, {
        data: { productId },
        headers: { Authorization: `Bearer ${token}` },
      });

      set((state) => ({
        wishlist: state.wishlist.filter((item) => item._id !== productId),
      }));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    } finally {
      set({ loading: false });
    }
  },

  // ✅ Clear Wishlist on Logout
  clearWishlist: () => set({ wishlist: [], selectedProductId: null }),
}));

export default useWishlistStore;
