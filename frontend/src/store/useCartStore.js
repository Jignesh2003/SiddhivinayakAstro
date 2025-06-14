import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./useAuthStore";
import { toast } from "react-toastify";

const BASE = import.meta.env.VITE_BASE_URL;
const useCartStore = create((set, get) => ({
  cart: [],
  cartCount: 0, // ✅ Add cartCount
  loading: false,

 // ⚠️ Notice the field is called 'product', not 'productId'
  addToCart: async ({ product, size = "", quantity = 1 }) => {
    set({ loading: true });
    try {
      const { token } = useAuthStore.getState();
      if (!token) {
        toast.error("Please log in first!");
        return;
      }

      // <-- This body shape must match your controller’s destructuring
      const { data } = await axios.post(
        `${BASE}/add-cart`,
        { product, size, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const items = data.items;
      set({
        cart: items,
        cartCount: items.reduce((sum, i) => sum + i.quantity, 0),
      });
      toast.success("Added to cart!");
      return data;
    } catch (err) {
      console.error("addToCart error:", err.response?.data || err);
      toast.error("Failed to add to cart.");
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  fetchCart: async () => {
    try {
      set({ loading: true });
      const { userId, token } = useAuthStore.getState();

      if (!token || !userId) {
        console.error("User not authenticated. Please log in.");
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/cart/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        params: { timestamp: new Date().getTime() },
      });

      console.log("Cart API Response:", response.data);

      if (response.data.userId === userId) {
        const updatedCart = response.data.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          _id: item._id,
        }));

        const totalCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0); // ✅ Calculate total count
        set({ cart: updatedCart, cartCount: totalCount });
      } else {
        console.warn("Mismatched user cart detected! Clearing cart.");
        set({ cart: [], cartCount: 0 });
      }
    } catch (error) {
      console.error("Error fetching cart:", error.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },

  updateCart: async (productId, quantity) => {
    try {
      set({ loading: true });
      const { userId, token } = useAuthStore.getState();

      if (!token || !userId) {
        console.error("User not authenticated. Please log in.");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/update`,
        { productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.cart) {
        const totalCount = response.data.cart.items.reduce((sum, item) => sum + item.quantity, 0); // ✅ Calculate total count
        set({ cart: response.data.cart.items, cartCount: totalCount });
      } else {
        console.warn("Unexpected API response format:", response.data);
        get().fetchCart();
      }
    } catch (error) {
      console.error("Error updating cart:", error.response?.data || error.message);
      get().fetchCart();
    } finally {
      set({ loading: false });
    }
  },

  removeFromCart: async (product) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.product._id !== product),
      cartCount: state.cartCount - 1, // ✅ Update cartCount
    }));

    try {
      set({ loading: true });
      const { userId, token } = useAuthStore.getState();
      if (!token || !userId) {
        
        console.error("User not authenticated. Please log in.");
        return;
      }

      const response = await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/remove/${product}?userId=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        await get().fetchCart();
      } else {
        console.warn("Unexpected API response format:", response.data);
        get().fetchCart();
      }
    } catch (error) {
      console.error("Error removing from cart:", error.response?.data || error.message);
      get().fetchCart();
    } finally {
      set({ loading: false });
    }
  },

  clearCart: async () => {
    set({ cart: [], cartCount: 0 }); // ✅ Clear cart and reset count

    try {
      set({ loading: true });
      const { userId, token } = useAuthStore.getState();
      if (!token || !userId) {
        console.error("User not authenticated. Please log in.");
        return;
      }

      await axios.delete(`${import.meta.env.VITE_BASE_URL}/clear-cart/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Error clearing cart:", error.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },
}));

export default useCartStore;