import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Music, Loader2, ShoppingCart } from "lucide-react";
import assets from "../assets/assets";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import axios from "axios";

const Navbar = () => {
  const { isAuthenticated, login, logout, isVerified, role } = useAuthStore();
  const { cartCount } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
        if (error.response?.status === 401) logout();
      }
    };
    checkAuth();
  }, [login, logout]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
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

  const NavLinks = () => {
    const linkClass = "block text-white text-base font-medium hover:text-purple-400 transition-colors";
    return (
      <div className="flex flex-col space-y-3">
        <Link to="/" className={linkClass}>Home</Link>
        <Link to="/products" className={linkClass}>Products</Link>
        <Link to="/daily-prediction" className="block text-yellow-400 text-base font-medium hover:text-purple-300">Daily Prediction</Link>
        <Link to="/kundli-details" className="block text-yellow-400 text-base font-medium hover:text-purple-300">Kundli</Link>
        <Link to="/matching-form" className="block text-yellow-400 text-base font-medium hover:text-purple-300">Kundli Matching</Link>
        <Link to="/panchang-form" className="block text-yellow-400 text-base font-medium hover:text-purple-300">Panchang</Link>
        <Link to="/life-path-number" className="block text-yellow-400 text-base font-medium hover:text-purple-300">Life Path Number</Link>

        {isAuthenticated && role !== "astrologer" && (
          <>
            <Link to="/my-orders" className={linkClass}>My Orders</Link>
            <Link to="/wishlist" className={linkClass}>Loved it</Link>
            <Link to="/cart" className="relative block text-white hover:text-purple-400">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {cartCount}
                </span>
              )}
            </Link>
          </>
        )}

        {isAuthenticated && role === "astrologer" && (
          <>
            <Link to="/astrologer-dashboard" className={linkClass}>Astrologer Dashboard</Link>
            <Link to="/astrologer-chat-request" className={linkClass}>Chat Requests</Link>
          </>
        )}

        {isAuthenticated ? (
          <>
            {!isVerified && (
              <button onClick={() => navigate("/otp")} className="text-red-500 text-sm text-left">Please verify</button>
            )}
            <button onClick={handleLogout} className="text-white hover:text-red-500 text-base text-left">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className={linkClass}>Login</Link>
            <Link to="/sign-up" className={linkClass}>Sign Up</Link>
          </>
        )}

        <button onClick={toggleMusic} className="text-white flex items-center gap-2 text-left">
          ON/OFF <Music size={20} className={isPlaying ? "text-yellow-400" : "text-white"} />
        </button>
      </div>
    );
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Loader2 className="animate-spin text-yellow-500" size={50} />
        </div>
      )}

      <nav className="fixed top-0 left-0 w-full z-50 h-24 flex items-center backdrop-blur-md bg-black/80 px-4">
        <div
          className="absolute inset-0 z-[-1]"
          style={{
            backgroundImage: `url(${assets.GalaxyBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.2,
          }}
        />
        <audio ref={audioRef} src="/om_om_om.mp3" loop />

        {/* Logo at left */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={assets.SiddhivinayakAstroLogo} alt="Logo" className="h-16 w-auto object-contain" />
            <span className="text-xl sm:text-2xl font-bold text-yellow-500">Siddhivinayak Astro</span>
          </Link>
        </div>

        {/* Sidebar toggle (md+) */}
        <div className="ml-auto hidden md:flex">
          <button className="text-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden ml-auto flex">
          <button className="text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Sidebar for md+ */}
      {sidebarOpen && (
        <aside className="hidden md:flex fixed top-24 left-0 h-[calc(100vh-6rem)] w-64 flex-col bg-black/95 backdrop-blur border-r border-purple-800 shadow-md z-40 transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-800">
            <h2 className="text-yellow-400 text-lg font-semibold">Navigation</h2>
            <button onClick={() => setSidebarOpen(false)} className="text-white hover:text-red-500">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <NavLinks />
          </div>
        </aside>
      )}

      {/* Mobile Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-24 left-0 w-full bg-black/90 backdrop-blur-md flex flex-col items-center space-y-4 py-6 md:hidden z-40"
        >
          <NavLinks />
        </div>
      )}

      {/* Spacer to prevent content behind navbar */}
      <div className="h-24" />
    </>
  );
};

export default Navbar;
