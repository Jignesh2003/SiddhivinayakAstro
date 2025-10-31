import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./useAuthStore";
import { toast } from "react-toastify";

const BASE = import.meta.env.VITE_BASE_URL;

const useCartStore = create((set, get) => ({
  cart: [],
  cartCount: 0,
  loading: false,

  // 🆕 Updated addToCart with variant support
  addToCart: async ({
    product,
    size = "",
    quantity = 1,
    availableStock = 1,
    variantId = null,        // 🆕 Variant ID
    variant = null           // 🆕 Full variant object
  }) => {
    set({ loading: true });

    try {
      const { token } = useAuthStore.getState();
      if (!token) {
        toast.error("Please log in first!");
        return;
      }

      await get().fetchCart();
      const state = get();

      // 🆕 Updated duplicate check to include variant
      const cartItem = state.cart.find(
        (item) =>
          item.product._id === product &&
          // Check variant match
          ((variantId && item.variantId === variantId) ||
            // Or check size match (legacy)
            (size && item.size === size) ||
            // Or no variant/size (simple product)
            (!variantId && !size && !item.variantId && !item.size))
      );

      if (cartItem) {
        toast.success("Product already in cart!");
        return;
      }

      if (Number(quantity) > availableStock) {
        toast.error("Cannot add more than available stock!");
        return;
      }

      // 🆕 Send variant info to backend
      const { data } = await axios.post(
        `${BASE}/add-cart`,
        {
          product,
          size,
          quantity: Number(quantity),
          variantId,      // 🆕 Include variant ID
          variant         // 🆕 Include variant details
        },
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
      console.error("❌ addToCart error:", err);
      toast.error("Failed to add to cart.");
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  // 🆕 Updated fetchCart with variant support
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
      const validItems = [];

      for (const item of allItems) {
        const available = Number(item.availableStock ?? 0);

        if (available <= 0) {
          // Remove out-of-stock items
          const productId = item.product._id;
          const size = item.size || null;
          const variantId = item.variantId || null; // 🆕 Include variantId
          await get().removeFromCart(productId, size, variantId);
          console.warn(`Removed OOS item from cart:`, item.product.name);
        } else {
          validItems.push({
            product: item.product,
            cartQuantity: Number(item.cartQuantity ?? item.quantity ?? 1),
            availableStock: available,
            size: item.size ?? null,
            // 🆕 Include variant info
            variantId: item.variantId ?? null,
            variant: item.variant ?? null,
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

  // 🆕 Updated updateCart with variant support
  updateCart: async (
    productId,
    quantity,
    size = null,
    availableStock = null,
    variantId = null  // 🆕 Add variantId parameter
  ) => {
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

      // 🆕 Include variantId in update request
      await axios.put(
        `${BASE}/update`,
        {
          productId,
          quantity: safeQuantity,
          size,
          variantId  // 🆕 Send variantId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await get().fetchCart();
    } catch (error) {
      console.error("❌ updateCart error:", error);
      await get().fetchCart();
    } finally {
      set({ loading: false });
    }
  },

  // 🆕 Updated removeFromCart with variant support
  removeFromCart: async (product, size = null, variantId = null) => {
    // 🆕 Optimistic update - remove from local state immediately
    set((state) => ({
      cart: state.cart.filter(
        (item) =>
          !(
            item.product._id === product &&
            // Match variant if provided
            ((variantId && item.variantId === variantId) ||
              // Match size if provided (legacy)
              (size && item.size === size) ||
              // Match simple product (no variant/size)
              (!variantId && !size && !item.variantId && !item.size))
          )
      ),
    }));

    // Recalculate cart count
    set((state) => ({
      cartCount: state.cart.reduce((sum, item) => sum + item.cartQuantity, 0),
    }));

    set({ loading: true });

    try {
      const { userId, token } = useAuthStore.getState();
      if (!token || !userId) return;

      // 🆕 Include variantId in delete request
      await axios.delete(
        `${BASE}/remove/${product}?userId=${userId}&size=${size ?? ""}&variantId=${variantId ?? ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await get().fetchCart();
    } catch (error) {
      console.error("❌ removeFromCart error:", error);
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
      console.error("❌ clearCart error:", error);
    } finally {
      set({ loading: false });
    }
  },
}));

export default useCartStore;
