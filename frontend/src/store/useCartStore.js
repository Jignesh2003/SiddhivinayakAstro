import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./useAuthStore";
import { toast } from "react-toastify";

const BASE = import.meta.env.VITE_BASE_URL;

const useCartStore = create((set, get) => ({
  cart: [],
  cartCount: 0,
  loading: false,

  addToCart: async ({ product, size = "", quantity = 1 }) => {
    set({ loading: true });
    try {
      const { token } = useAuthStore.getState();
      if (!token) {
        toast.error("Please log in first!");
        return;
      }
      // Ensure quantity is sent as a number!
      const { data } = await axios.post(
        `${BASE}/add-cart`,
        { product, size, quantity: Number(quantity) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const items = data.items || [];
      set({
        cart: items,
        cartCount: items.reduce((sum, i) => sum + Number(i.quantity), 0),
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

      const response = await axios.get(
        `${BASE}/cart/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          params: { timestamp: new Date().getTime() },
        }
      );

      if (Array.isArray(response.data.items)) {
        // Ensure numbers
        const updatedCart = response.data.items.map((item) => ({
          product: item.product,
          cartQuantity: Number(item.cartQuantity),
          availableStock: Number(item.availableStock),
          size: item.size ?? null,
          _id: item._id,
        }));

        const totalCount = updatedCart.reduce(
          (sum, item) => sum + (item.cartQuantity ?? 0),
          0
        );
        set({ cart: updatedCart, cartCount: totalCount });
      } else {
        set({ cart: [], cartCount: 0 });
      }
    } catch (error) {
      set({ cart: [], cartCount: 0 });
      console.error("Error fetching cart:", error.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },

  updateCart: async (productId, quantity, size = null) => {
    try {
      set({ loading: true });
      const { userId, token } = useAuthStore.getState();

      if (!token || !userId) {
        console.error("User not authenticated. Please log in.");
        return;
      }

      // Always send as number!
      const safeQuantity = Number(quantity);

      const response = await axios.put(
        `${BASE}/update`,
        { productId, quantity: safeQuantity, size },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await get().fetchCart();
    } catch (error) {
      console.log(error);
      
      await get().fetchCart();
    } finally {
      set({ loading: false });
    }
  },

  removeFromCart: async (product, size = null) => {
    set((state) => ({
      cart: state.cart.filter(
        (item) =>
          item.product._id !== product ||
          (size && item.size !== size)
      ),
      cartCount: state.cartCount - 1,
    }));

    try {
      set({ loading: true });
      const { userId, token } = useAuthStore.getState();
      if (!token || !userId) return;

      // Accepts size for unique cart row handling
      await axios.delete(
        `${BASE}/remove/${product}?userId=${userId}&size=${size ?? ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await get().fetchCart();
    } catch (error) {
      console.log(error);
      
      await get().fetchCart();
    } finally {
      set({ loading: false });
    }
  },

  clearCart: async () => {
    set({ cart: [], cartCount: 0 });
    try {
      set({ loading: true });
      const { userId, token } = useAuthStore.getState();
      if (!token || !userId) return;
      await axios.delete(`${BASE}/clear-cart/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {console.log(error);
    } finally {
      set({ loading: false });
    }
  },
}));

export default useCartStore;
