// App.jsx
import { useEffect, useState } from "react";
import useAuthStore from "./store/useAuthStore";
import useWishlistStore from "./store/useWishlistStore";
import Navbar from "./components/Navbar";
import AllRoutes from "../Routes/AllRoutes";
import { ToastContainer } from "react-toastify";
import { Toaster } from "react-hot-toast";
import WhatsAppPhoneFAB from "./lib/WhatsAppPhoneFab";

const App = () => {
  const { login, isAuthenticated } = useAuthStore();
  const { fetchWishlist }         = useWishlistStore();
  const [restored, setRestored]   = useState(false);

  useEffect(() => {
    // 1) On mount, read exactly what we stored last time
    try {
      const raw = localStorage.getItem("auth-data");
      if (raw) {
        const { token, role, isVerified, userId } = JSON.parse(raw);
        // 2) Only *call* login(...) if *all* fields are present
        if (token && role && typeof isVerified === "boolean" && userId) {
          login(token, role, isVerified, userId);
        }
      }
    } catch (err) {
      console.error("❌ Failed to restore session:", err);
    }
    setRestored(true);
  }, [login]);

  useEffect(() => {
    if (restored && isAuthenticated) {
      fetchWishlist(); // load wishlist only after we've restored auth
    }
  }, [restored, isAuthenticated, fetchWishlist]);

  if (!restored) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Restoring session…
      </div>
    );
  }

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} />
      <ToastContainer position="top-right" autoClose={3000} />
      <Toaster position="top-right" />
      <WhatsAppPhoneFAB/>
      <AllRoutes />
    </>
  );
};

export default App;
