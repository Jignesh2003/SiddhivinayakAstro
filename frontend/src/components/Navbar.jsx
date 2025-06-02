import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Music,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import assets from "../assets/assets";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import axios from "axios";

const Navbar = () => {
  const { isAuthenticated, login, logout, isVerified, role } = useAuthStore();
  const { cartCount } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { token } = useAuthStore.getState();
        if (!token) return;
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/checking-auth`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.status === 200) {
          const { role, isVerified, userId } = response.data;
          login(token, role, isVerified, userId);
        }
      } catch (error) {
        console.error("Auth check failed:", error.response?.data || error.message);
        if (error.response?.status === 401) {
          logout();
        }
      }
    };
    checkAuth();
  }, [login, logout]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (audioRef.current) {
      const playAudio = async () => {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
          document.addEventListener("click", playAudio, { once: true });
        }
      };
      playAudio();
    }
    return () => document.removeEventListener("click", () => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Loader2 className="animate-spin text-yellow-500" size={50} />
        </div>
      )}

      <nav
        className="fixed top-0 w-full h-24 flex items-center justify-center shadow-md z-50"
        style={{
          backgroundImage: `url(${assets.GalaxyBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <audio ref={audioRef} src="/om_om_om.mp3" loop />

        <div className="w-full max-w-7xl px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={assets.SiddhivinayakAstroLogo}
              alt="Logo"
              className="h-16 w-auto object-contain"
            />
            <span className="text-xl sm:text-2xl font-bold text-yellow-500">
              Siddhivinayak Astro
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            <Link to="/" className="text-white hover:text-purple-400 text-lg">Home</Link>
            <Link to="/products" className="text-white hover:text-purple-400 text-lg">Products</Link>
            {isAuthenticated && role !== "astrologer" && (
              <>
                <Link to="/my-orders" className="text-white hover:text-purple-400 text-lg">My Orders</Link>
                <Link to="/wishlist" className="text-white hover:text-purple-400 text-lg">Loved it</Link>
                <Link to="/cart" className="relative text-white hover:text-purple-400">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 transform translate-x-1/2 -translate-y-1/2">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* Astrologer-specific links */}
            {isAuthenticated && role === "astrologer" && (
              <>
                <Link to="/astrologer-dashboard" className="text-white hover:text-purple-400 text-lg">
                  Astrologer Dashboard
                </Link>
               
                <Link to="/astrologer-chat-request" className="text-white hover:text-purple-400 text-lg">
                  Chat Requests
                </Link>
              </>
            )}

            {/* Auth buttons */}
            {isAuthenticated ? (
              <>
                {!isVerified && (
                  <button
                    onClick={() => navigate("/otp")}
                    className="text-red-500 text-sm"
                  >
                    Please verify
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-red-500 text-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-purple-400 text-lg">Login</Link>
                <Link to="/sign-up" className="text-white hover:text-purple-400 text-lg">Sign Up</Link>
              </>
            )}

            <button onClick={toggleMusic} className="text-white flex items-center">
              ON/OFF <Music size={20} className={`ml-2 ${isPlaying ? "text-yellow-400" : "text-white"}`} />
            </button>
          </div>

          {/* Mobile Nav Button */}
          <div className="lg:hidden flex items-center gap-4">
            <button className="text-white" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div
            ref={menuRef}
            className="absolute top-24 left-0 w-full bg-black bg-opacity-95 flex flex-col items-center space-y-4 py-6 lg:hidden"
            style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
          >
            <Link to="/" className="text-white text-lg hover:text-purple-500" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/products" className="text-white text-lg hover:text-purple-500" onClick={() => setIsOpen(false)}>Products</Link>

            {isAuthenticated && role !== "astrologer" && (
              <>
                <Link to="/my-orders" className="text-white text-lg hover:text-purple-500" onClick={() => setIsOpen(false)}>My Orders</Link>
                <Link to="/wishlist" className="text-white text-lg hover:text-purple-500" onClick={() => setIsOpen(false)}>Loved it</Link>
                <Link to="/cart" className="text-white text-lg hover:text-purple-500" onClick={() => setIsOpen(false)}>Cart</Link>
              </>
            )}

            {/* Astrologer-specific mobile */}
            {isAuthenticated && role === "astrologer" && (
              <>
                <Link to="/astrologer-dashboard" className="text-white text-lg hover:text-purple-500" onClick={() => setIsOpen(false)}>Astrologer Dashboard</Link>
                <Link to="/profile" className="text-white text-lg hover:text-purple-500" onClick={() => setIsOpen(false)}>Profile</Link>
                <Link to="/astrologer-chat-request" className="text-white text-lg hover:text-purple-500" onClick={() => setIsOpen(false)}>Chat Requests</Link>
              </>
            )}

            {isAuthenticated ? (
              <>
                {!isVerified && (
                  <button onClick={() => { navigate("/otp"); setIsOpen(false); }} className="text-red-500 text-sm">
                    Please verify
                  </button>
                )}
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="text-white hover:text-red-500 text-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white text-lg hover:text-purple-500" onClick={() => setIsOpen(false)}>Login</Link>

                <Link to="/sign-up" className="text-white text-lg hover:text-purple-500" onClick={() => setIsOpen(false)}>Sign Up</Link>
              </>
            )}

            <button onClick={toggleMusic} className="text-white text-lg">
              <Music size={20} className={`${isPlaying ? "text-yellow-400" : "text-white"}`} />
            </button>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content overlap */}
      <div className="h-24" />
    </>
  );
};

export default Navbar;
