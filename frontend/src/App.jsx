import  'react'
import AllRoutes from '../Routes/AllRoutes'
import Navbar from './components/Navbar'
import useAuthStore from "./store/useAuthStore"; // ✅ Import Zustand
import useWishlistStore from './store/useWishlistStore';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const { isAuthenticated , token} = useAuthStore(); // ✅ Get authentication state
  const { fetchWishlist } = useWishlistStore();
  useEffect(() => {
    if (token) fetchWishlist(); // ✅ Load wishlist if user is logged in
  }, [token]);

  return (
    <div>
      <Navbar isAuthenticated={isAuthenticated} />
      <ToastContainer position="top-right" autoClose={3000} />    
      <Toaster position="top-right" reverseOrder={false} />
        <AllRoutes />
    </div>
  );
}

export default App;
