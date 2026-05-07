// store/useAstrologerStore.js
import { create } from "zustand";
import axios from "axios";

const STORAGE_KEY = "astroToken";
const ASTRO_DATA_KEY = "astroData";
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

let logoutTimer = null;

const clearTimer = () => {
  if (logoutTimer) {
    clearTimeout(logoutTimer);
    logoutTimer = null;
  }
};

// Read from localStorage at startup
let initialToken = null;
let initialAstroData = null;
try {
  initialToken = localStorage.getItem(STORAGE_KEY);
  const raw = localStorage.getItem(ASTRO_DATA_KEY);
  if (raw) initialAstroData = JSON.parse(raw);
} catch (e) {
  console.warn("Could not parse astrologer data:", e);
}

const useAstrologerStore = create((set, get) => ({
  token: initialToken,
  astrologerData: initialAstroData,
  isAuthenticated: Boolean(initialToken),
  loading: false,

  login: (token, astrologerData) => {
    if (!token || !astrologerData) {
      console.error("🚫 login() called with incomplete data");
      return;
    }

    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(ASTRO_DATA_KEY, JSON.stringify(astrologerData));

    set({
      token,
      astrologerData,
      isAuthenticated: true,
      loading: false
    });

    // Start 1-hour auto-logout timer
    clearTimer();
    logoutTimer = setTimeout(() => {
      console.log("🔴 Astrologer session expired - auto logout");
      get().logout();
      window.location.href = "/login";
    }, INACTIVITY_TIMEOUT);
  },

  logout: () => {
    clearTimer();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ASTRO_DATA_KEY);
    set({
      token: null,
      astrologerData: null,
      isAuthenticated: false,
      loading: false
    });
  },

  toggleLive: async () => {
    const { token } = get();
    if (!token) {
      console.error("No token available for toggle live");
      return false;
    }

    try {
      set({ loading: true });
      const response = await axios.put(
        `${import.meta.env.VITE_ASTRO_URL}/toggle-live`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        const newIsOnline = response.data.isOnline;
        const updatedData = { ...get().astrologerData, isOnline: newIsOnline };
        localStorage.setItem(ASTRO_DATA_KEY, JSON.stringify(updatedData));
        set({ astrologerData: updatedData });
        return newIsOnline;
      }
    } catch (error) {
      console.error("Error toggling live status:", error);
    } finally {
      set({ loading: false });
    }

    return false;
  },

  checkAuth: () => {
    const { token } = get();
    return Boolean(token);
  },

  resetTimer: () => {
    const { isAuthenticated, logout } = get();
    if (!isAuthenticated) return;

    clearTimer();
    logoutTimer = setTimeout(() => {
      console.log("🔴 Astrologer session expired - auto logout");
      logout();
      window.location.href = "/login";
    }, INACTIVITY_TIMEOUT);
  },
}));

export default useAstrologerStore;
