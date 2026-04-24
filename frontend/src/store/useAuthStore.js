// store/useAuthStore.js
import { create } from "zustand";
import useWishlistStore from "./useWishlistStore";

const STORAGE_KEY = "auth-data";
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

let logoutTimer = null;

const clearTimer = () => {
  if (logoutTimer) {
    clearTimeout(logoutTimer);
    logoutTimer = null;
  }
};

// 1) Read whatever is in localStorage right now:
let initial = { token: null, role: null, isVerified: false, userId: null };
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) initial = JSON.parse(raw);
} catch (e) {
  console.warn("Could not parse auth-data:", e);
}

const useAuthStore = create((set, get) => ({
  // 2) Seed the store from that
  token: initial.token,
  role: initial.role,
  isVerified: initial.isVerified,
  userId: initial.userId,
  isAuthenticated: Boolean(initial.token),
  cart: [],
  loading: false,

  // 3) Only overwrite localStorage with a *full* auth object
  login: (token, role, isVerified, userId) => {
    if (!token || !role || typeof isVerified !== "boolean" || !userId) {
      console.error("🚫 login() called with incomplete data, skipping storage write");
      return;
    }
    const authData = { token, role, isVerified, userId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    set({ token, role, isVerified, userId, isAuthenticated: true });

    // Start 1-hour auto-logout timer
    clearTimer();
    logoutTimer = setTimeout(() => {
      console.log("🔴 Session expired - auto logout");
      get().logout();
      window.location.href = "/login";
    }, INACTIVITY_TIMEOUT);

    useWishlistStore.getState().fetchWishlist?.();
  },

  logout: () => {
    clearTimer();
    localStorage.removeItem(STORAGE_KEY);
    set({
      token: null,
      role: null,
      isVerified: false,
      userId: null,
      isAuthenticated: false,
      cart: [],
    });
    useWishlistStore.getState().clearWishlist?.();
  },

  resetTimer: () => {
    const { isAuthenticated, logout } = get();
    if (!isAuthenticated) return;

    clearTimer();
    logoutTimer = setTimeout(() => {
      console.log("🔴 Session expired - auto logout");
      logout();
      window.location.href = "/login";
    }, INACTIVITY_TIMEOUT);
  },

  setCart: (items) => set({ cart: items }),
  clearCart: () => set({ cart: [] }),
}));

export default useAuthStore;