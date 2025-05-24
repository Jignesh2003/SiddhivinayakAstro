import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./useAuthStore";
import useCartStore from "./useCartStore";

const useOrderStore = create((set, get) => ({
  orders: [],
  allOrders: [], // For admin
  loading: false,

 // ✅ Fetch User Orders
 fetchUserOrders: async () => {
  try {
    set({ loading: true });
    const { token, userId } = useAuthStore.getState();
    if (!token || !userId) return;

    const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/user-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Backend Response:", response.data); // ✅ Log backend response
    set({ orders: response.data || [], loading: false }); // ✅ Update orders state
  } catch (error) {
    console.error("Error fetching orders:", error);
    set({ loading: false });
  }
},

  

  // ✅ Place a New Order
  placeOrder: async () => {
    try {
      set({ loading: true });
      const { token, userId } = useAuthStore.getState();
      if (!token || !userId) {
        console.error("User not authenticated");
        return;
      }
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/place-order`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        await get().fetchUserOrders(); // ✅ Refresh user orders
        useCartStore.getState().clearCart(); // ✅ Clear cart after successful order
      }
      return response.data;
    } catch (error) {
      console.error("Error placing order:", error.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },

  // ✅ Fetch All Orders (Admin)
  fetchAllOrders: async () => {
    try {
      const { token } = useAuthStore.getState();
      set({ loading: true });
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/admin/all-orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set({ allOrders: response.data });
    } catch (error) {
      console.error("Error fetching all orders:", error.response?.data || error.message);
    } finally {
      set({ loading: false });
    }
  },

  // ✅ Update Order Status (Admin)
  updateOrderStatus: async (orderId, status) => {
    try {
      const { token } = useAuthStore.getState();
      set({ loading: true });
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/admin/update-status`,
        { orderId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (response.status === 200) {
        await get().fetchAllOrders(); // ✅ Refresh order list
      } else {
        console.error("Order update failed:", response.data);
      }
  
      return response.data;
    } catch (error) {
      console.error("Error updating order status:", error.response?.data || error.message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));

export default useOrderStore;
