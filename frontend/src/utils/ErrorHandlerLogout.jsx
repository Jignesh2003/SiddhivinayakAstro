// utils/apiErrorHandler.js
import useAuthStore from "../store/useAuthStore";

export const handleAuthError = (err) => {
    const { logout } = useAuthStore.getState();
    const status = err?.response?.status;

    if (status === 401) {
        console.warn(`❌ API responded with ${status}, logging out...`);
        logout();
        return true; // indicates logout occurred
    }

    return false; // no logout
};
