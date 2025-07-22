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

      // Find if product+size already in cart
      const cartItem = get().cart.find(
        (item) =>
          item.product._id === product &&
          (size ? item.size === size : true)
      );
      let newQuantity = Number(quantity);
      if (cartItem) {
        newQuantity = Number(cartItem.cartQuantity ?? cartItem.quantity ?? 1) + 1;
      }
      // Clamp to available stock
      if (newQuantity > availableStock) {
        toast.error("Cannot add more than available stock!");
        set({ loading: false });
        return;
      }
      if (newQuantity < 1) newQuantity = 1;

      const { data } = await axios.post(
        `${BASE}/add-cart`,
        { product, size, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const items = data.items || [];
      set({
        cart: items,
        cartCount: items.reduce((sum, i) => sum + Number(i.cartQuantity ?? i.quantity), 0),
      });
      toast.success(cartItem ? "Quantity increased!" : "Added to cart!");
      return data;
    } catch (err) {
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

      if (!token || !userId) return;

      const response = await axios.get(
        `${BASE}/cart/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { timestamp: new Date().getTime() },
        }
      );

      if (Array.isArray(response.data.items)) {
        const updatedCart = response.data.items.map((item) => ({
          product: item.product,
          cartQuantity: Number(item.cartQuantity ?? item.quantity ?? 1),
          availableStock: Number(item.availableStock ?? 1),
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
      console.log(error);
      
      set({ cart: [], cartCount: 0 });
    } finally {
      set({ loading: false });
    }
  },

  updateCart: async (productId, quantity, size = null, availableStock = null) => {
    try {
      set({ loading: true });
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
          item.product._id !== product ||
          (size && item.size !== size)
      ),
      cartCount: state.cartCount - 1,
    }));

    try {
      set({ loading: true });
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
