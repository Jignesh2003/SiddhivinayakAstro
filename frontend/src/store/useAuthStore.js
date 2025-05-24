import { create } from "zustand";
import { persist } from "zustand/middleware";
import useWishlistStore from "./useWishlistStore";

const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      role: null,
      userId: null,
      isVerified: false,
      cart: [], // ✅ Store cart
      loading: false, // ✅ Added loading state

      // ✅ Login & Fetch User Details
      login: async (token, role, isVerified, userId) => {
        
        set({ loading: true }); // ✅ Start loading
        try {
          set({ isAuthenticated: true, token, role, userId, isVerified ,loading: true}); // ✅ Set user details
          await useWishlistStore.getState().fetchWishlist(); // ✅ Fetch wishlist if needed          
        } catch(err){
          console.log(err?.message);
          
        }finally {
          set({ loading: false }); // ✅ Stop loading
        }
      },

      // ✅ Logout
      logout: () => {
        set({
          isAuthenticated: false,
          token: null,
          role: null,
          userId: null,
          isVerified: false,
          cart: [],
          loading: false, // ✅ Ensure loading is false on logout
        });
        useWishlistStore.getState().clearWishlist();
      },

      // ✅ Cart Management
      setCart: (items) => set({ cart: items }),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "auth-storage", // ✅ Saves auth data in localStorage
      getStorage: () => localStorage,
    }
  )
);

export default useAuthStore;
