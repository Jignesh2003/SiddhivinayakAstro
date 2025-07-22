import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./useAuthStore";
import { toast } from "react-toastify";

const BASE = import.meta.env.VITE_BASE_URL;

const useCartStore = create((set, get) => ({
  cart: [],
  cartCount: 0,
  loading: false,

  addToCart: async ({ product, size = "", quantity = 1, availableStock = 1 }) => {
    set({ loading: true });

    try {
      const { token } = useAuthStore.getState();
      if (!token) {
        toast.error("Please log in first!");
        return;
      }

      await get().fetchCart();
      const state = get();
      const cartItem = state.cart.find(
        (item) =>
          item.product._id === product &&
          ((size && item.size === size) || (!size && !item.size))
      );

      if (cartItem) {
        toast.success("Product already in cart!");
        return; // ✅ Don't increment quantity
      }

      if (Number(quantity) > availableStock) {
        toast.error("Cannot add more than available stock!");
        return;
      }

      const { data } = await axios.post(
        `${BASE}/add-cart`,
        { product, size, quantity: Number(quantity) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const items = data.items || [];
      set({
        cart: items,
        cartCount: items.reduce((sum, i) => sum + Number(i.cartQuantity ?? i.quantity), 0),
      });
      console.log("🛒 Cart after add:", get().cart);
      toast.success("Added to cart!");
      return data;

    } catch (err) {
      toast.error("Failed to add to cart.");
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  fetchCart: async () => {
    set({ loading: true });

    try {
      const { userId, token } = useAuthStore.getState();
      if (!token || !userId) return;

      const response = await axios.get(`${BASE}/cart/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { timestamp: new Date().getTime() },
      });

      if (!Array.isArray(response?.data?.items)) {
        set({ cart: [], cartCount: 0 });
        return;
      }

      const allItems = response.data.items;

      // Filter out items with availableStock <= 0
      const validItems = [];

      for (const item of allItems) {
        const available = Number(item.availableStock ?? 0);

        if (available <= 0) {
          // 🔥 Remove item from cart if out of stock
          const productId = item.product._id;
          const size = item.size || null;
          await get().removeFromCart(productId, size);
          console.warn(`Removed OOS item from cart:`, item.product.name);
        } else {
          validItems.push({
            product: item.product,
            cartQuantity: Number(item.cartQuantity ?? item.quantity ?? 1),
            availableStock: available,
            size: item.size ?? null,
            _id: item._id,
          });
        }
      }

      const totalCount = validItems.reduce((sum, item) => sum + item.cartQuantity, 0);
      set({ cart: validItems, cartCount: totalCount });

    } catch (error) {
      console.error("❌ fetchCart error", error);
      set({ cart: [], cartCount: 0 });
    } finally {
      set({ loading: false });
    }
  },

  updateCart: async (productId, quantity, size = null, availableStock = null) => {
    set({ loading: true });
    try {
      const { userId, token } = useAuthStore.getState();
      if (!token || !userId) return;

      let safeQuantity = Number(quantity);
      if (availableStock !== null && safeQuantity > availableStock) {
        toast.error("Cannot exceed available stock!");
        set({ loading: false });
        return;
      }

      if (safeQuantity < 1) safeQuantity = 1;

      await axios.put(
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
          item.product._id !== product || (size && item.size !== size)
      ),
      cartCount: state.cartCount - 1,
    }));

    set({ loading: true });

    try {
      const { userId, token } = useAuthStore.getState();
      if (!token || !userId) return;

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
    set({ loading: true });

    try {
      const { userId, token } = useAuthStore.getState();
      if (!token || !userId) return;

      await axios.delete(`${BASE}/clear-cart/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.log(error);
    } finally {
      set({ loading: false });
    }
  },
}));

export default useCartStore;
