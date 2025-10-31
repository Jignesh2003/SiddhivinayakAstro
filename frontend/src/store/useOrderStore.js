import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./useAuthStore";
import useCartStore from "./useCartStore";

const useOrderStore = create((set, get) => ({
  orders: [],
  allOrders: [], // For admin
  loading: false,
  error: null,

  // ✅ Fetch User Orders
  fetchUserOrders: async () => {
    try {
      set({ loading: true, error: null });
      const { token, userId } = useAuthStore.getState();

      if (!token || !userId) {
        console.warn("User not authenticated");
        set({ loading: false });
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/user-orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ User orders fetched:", response.data);

      // Sort orders by date (newest first)
      const sortedOrders = (response.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      set({ orders: sortedOrders, loading: false });
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      set({
        error: error.response?.data?.message || "Failed to fetch orders",
        loading: false
      });
    }
  },

  // ✅ Place a New Order (with variant support)
  placeOrder: async (orderData = null) => {
    try {
      set({ loading: true, error: null });
      const { token, userId } = useAuthStore.getState();

      if (!token || !userId) {
        throw new Error("User not authenticated");
      }

      // 🆕 Get cart to prepare order items with variants
      const cart = useCartStore.getState().cart;

      // 🆕 Prepare order items with variant support
      const orderItems = cart.map(item => {
        const baseItem = {
          product: item.product._id,
          quantity: item.cartQuantity ?? item.quantity ?? 1,
        };

        // Include variant info if present
        if (item.variantId && item.variant) {
          return {
            ...baseItem,
            variantId: item.variantId,
            variant: {
              variantName: item.variant.variantName,
              gram: item.variant.gram,
              price: item.variant.price,
              sku: item.variant.sku,
            },
            price: item.variant.price,
          };
        }

        // Legacy product with size
        return {
          ...baseItem,
          size: item.size || null,
          price: item.product.price,
        };
      });

      // 🆕 Calculate total with variant prices
      const totalAmount = orderItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Prepare order payload
      const orderPayload = {
        items: orderItems,
        totalAmount,
        ...orderData, // Include shipping address, payment method, etc.
      };

      console.log("📦 Placing order:", orderPayload);

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/place-order`,
        orderPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        console.log("✅ Order placed successfully:", response.data);

        // Refresh user orders
        await get().fetchUserOrders();

        // Clear cart after successful order
        await useCartStore.getState().clearCart();

        set({ loading: false });
        return response.data;
      }
    } catch (error) {
      console.error("❌ Error placing order:", error.response?.data || error.message);
      set({
        error: error.response?.data?.message || "Failed to place order",
        loading: false
      });
      throw error;
    }
  },

  // ✅ Fetch All Orders (Admin)
  fetchAllOrders: async () => {
    try {
      set({ loading: true, error: null });
      const { token } = useAuthStore.getState();

      if (!token) {
        console.warn("Admin not authenticated");
        set({ loading: false });
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/admin/all-orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ All orders fetched (admin):", response.data);

      // Sort orders by date (newest first)
      const sortedOrders = (response.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      set({ allOrders: sortedOrders, loading: false });
    } catch (error) {
      console.error("❌ Error fetching all orders:", error.response?.data || error.message);
      set({
        error: error.response?.data?.message || "Failed to fetch orders",
        loading: false
      });
    }
  },

  // ✅ Update Order Status (Admin)
  updateOrderStatus: async (orderId, status) => {
    try {
      set({ loading: true, error: null });
      const { token } = useAuthStore.getState();

      if (!token) {
        throw new Error("Admin not authenticated");
      }

      console.log(`🔄 Updating order ${orderId} to status: ${status}`);

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/admin/update-status`,
        { orderId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        console.log("✅ Order status updated");

        // Refresh order list
        await get().fetchAllOrders();

        set({ loading: false });
        return response.data;
      } else {
        console.error("Order update failed:", response.data);
        throw new Error(response.data.message || "Failed to update order");
      }
    } catch (error) {
      console.error("❌ Error updating order status:", error.response?.data || error.message);
      set({
        error: error.response?.data?.message || "Failed to update order status",
        loading: false
      });
      throw error;
    }
  },

  // 🆕 Get Single Order (for order detail page)
  fetchOrderById: async (orderId) => {
    try {
      set({ loading: true, error: null });
      const { token } = useAuthStore.getState();

      if (!token) {
        throw new Error("User not authenticated");
      }

      console.log(`📄 Fetching order: ${orderId}`);

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/order/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Order fetched:", response.data);
      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching order:", error.response?.data || error.message);
      set({
        error: error.response?.data?.message || "Failed to fetch order",
        loading: false
      });
      throw error;
    }
  },

  // 🆕 Cancel Order (User)
  cancelOrder: async (orderId) => {
    try {
      set({ loading: true, error: null });
      const { token } = useAuthStore.getState();

      if (!token) {
        throw new Error("User not authenticated");
      }

      console.log(`❌ Cancelling order: ${orderId}`);

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/cancel-order/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        console.log("✅ Order cancelled");

        // Refresh user orders
        await get().fetchUserOrders();

        set({ loading: false });
        return response.data;
      }
    } catch (error) {
      console.error("❌ Error cancelling order:", error.response?.data || error.message);
      set({
        error: error.response?.data?.message || "Failed to cancel order",
        loading: false
      });
      throw error;
    }
  },

  // 🆕 Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useOrderStore;
