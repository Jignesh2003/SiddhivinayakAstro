import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Music,
  Loader2,
  ShoppingCart,
  Wallet,
  Heart,
} from "lucide-react";
import assets from "../assets/assets";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import axios from "axios";

const Navbar = () => {
  const { isAuthenticated, login, logout, role } = useAuthStore();
  const { cartCount } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAstroDropdownOpen, setIsAstroDropdownOpen] = useState(false);
  const astroDropdownRef = useRef(null);
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
    return () => document.removeEventListener("click", () => { });
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => { });
    setIsPlaying(!isPlaying);
  };

  // --- Navigation Menus ---
  const userLinks = (
    <>
      <Link to="/my-orders" className="text-white hover:text-purple-400 text-lg">My Orders</Link>
      <Link to="/wishlist" className="text-white hover:text-purple-400 text-lg flex items-center gap-1">
        <Heart className="w-5 h-5" />
        Wishlist
      </Link>
      <Link to="/cart" className="relative text-white hover:text-purple-400">
        <ShoppingCart size={20} />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
            {cartCount}
          </span>
        )}
      </Link>
      <Link to="/wallet" className="flex items-center gap-1 text-white hover:text-purple-400 text-lg">
        <Wallet size={20} /> Wallet
      </Link>
    </>
  );

  const astroLinks = (
    <>
      <Link to="/astrologer-dashboard" className="text-white hover:text-purple-400 text-lg">Astrologer Dashboard</Link>
      <Link to="/astrologer-chat-request" className="text-white hover:text-purple-400 text-lg">Chat Requests</Link>
      <Link to="/wallet" className="flex items-center gap-1 text-white hover:text-purple-400 text-lg">
        <Wallet size={20} /> Wallet
      </Link>
    </>
  );

  // --- Main JSX ---
  return (
    <>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Loader2 className="animate-spin text-yellow-500" size={50} />
        </div>
      )}

      <nav className="fixed top-0 left-0 w-full z-50 h-24 flex items-center backdrop-blur-md bg-black/80">
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

        <div className="w-full max-w-7xl px-4 mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={assets.SiddhivinayakAstroLogo}
              alt="Logo"
              className="h-20 sm:h-16 w-auto object-contain"
            />
            <div className="flex flex-col">
              <h1 className="text-yellow-500 font-extrabold text-2xl sm:text-3xl md:text-4xl leading-tight">
                Siddhivinayak Astro
              </h1>
              <p className="text-yellow-300 italic text-sm sm:text-base tracking-wide mt-1">
                Your Stars, Your Story, Your Future
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            <Link to="/" className="text-white hover:text-purple-400 text-lg">
              Home
            </Link>
            <Link
              to="/products"
              className="text-white hover:text-purple-400 text-lg"
            >
              Products
            </Link>

            {/* Astrology Dropdown */}
            <div className="relative" ref={astroDropdownRef}>
              <button
                className="text-yellow-400 hover:text-yellow-300 text-lg font-medium flex items-center gap-1 focus:outline-none"
                aria-haspopup="true"
                aria-expanded={isAstroDropdownOpen}
                type="button"
                onClick={() => setIsAstroDropdownOpen((prev) => !prev)}
              >
                Astrology
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isAstroDropdownOpen ? "rotate-180" : "rotate-0"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div
                className={`absolute top-full left-0 mt-2 w-48 bg-black bg-opacity-90 rounded shadow-lg ring-1 ring-black ring-opacity-5 z-50
      transition-opacity duration-300
      ${isAstroDropdownOpen ? "opacity-100 visible" : "opacity-0 invisible"}
    `}
              >
                <Link
                  to="/daily-prediction"
                  className="block px-4 py-2 text-yellow-400 hover:bg-yellow-500 hover:text-black cursor-pointer"
                  onClick={() => setIsAstroDropdownOpen(false)}
                >
                  Daily Prediction
                </Link>
                <Link
                  to="/kundli-details"
                  className="block px-4 py-2 text-yellow-400 hover:bg-yellow-500 hover:text-black cursor-pointer"
                  onClick={() => setIsAstroDropdownOpen(false)}
                >
                  Kundli
                </Link>
                <Link
                  to="/matching-form"
                  className="block px-4 py-2 text-yellow-400 hover:bg-yellow-500 hover:text-black cursor-pointer"
                  onClick={() => setIsAstroDropdownOpen(false)}
                >
                  Kundli Matching
                </Link>
                <Link
                  to="/panchang-form"
                  className="block px-4 py-2 text-yellow-400 hover:bg-yellow-500 hover:text-black cursor-pointer"
                  onClick={() => setIsAstroDropdownOpen(false)}
                >
                  Panchang
                </Link>
                <Link
                  to="/life-path-number"
                  className="block px-4 py-2 text-yellow-400 hover:bg-yellow-500 hover:text-black cursor-pointer"
                  onClick={() => setIsAstroDropdownOpen(false)}
                >
                  Life Path
                </Link>
              </div>
            </div>
            {/* Other links are removed from desktop that now appear in dropdown */}

            {isAuthenticated
              ? role !== "astrologer"
                ? userLinks
                : astroLinks
              : null}

            {isAuthenticated ? (
              <>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-red-500 text-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-purple-400 text-lg"
                >
                  Login
                </Link>
                <Link
                  to="/sign-up"
                  className="text-white hover:text-purple-400 text-lg"
                >
                  Sign Up
                </Link>
              </>
            )}

            <button
              onClick={toggleMusic}
              className="text-white flex items-center"
            >
              ON/OFF{" "}
              <Music
                size={20}
                className={`ml-2 ${
                  isPlaying ? "text-yellow-400" : "text-white"
                }`}
              />
            </button>
          </div>

          {/* Mobile Nav Toggle */}
          <div className="lg:hidden flex items-center gap-4">
            <button className="text-white" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div
            ref={menuRef}
            className="absolute top-24 left-0 w-full bg-black/90 backdrop-blur-md flex flex-col items-center space-y-4 py-6 lg:hidden"
          >
            <Link
              to="/"
              className="text-white text-lg hover:text-purple-500"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-white text-lg hover:text-purple-500"
              onClick={() => setIsOpen(false)}
            >
              Products
            </Link>
            <Link
              to="/daily-prediction"
              className="text-yellow-400 text-lg font-medium hover:text-yellow-300"
              onClick={() => setIsOpen(false)}
            >
              Daily Prediction
            </Link>
            <Link
              to="/kundli-details"
              className="text-yellow-400 text-lg font-medium hover:text-yellow-300"
              onClick={() => setIsOpen(false)}
            >
              Kundli
            </Link>
            <Link
              to="/matching-form"
              className="text-yellow-400 text-lg font-medium hover:text-yellow-300"
              onClick={() => setIsOpen(false)}
            >
              Kundli Matching
            </Link>
            <Link
              to="/panchang-form"
              className="text-yellow-400 text-lg font-medium hover:text-yellow-300"
              onClick={() => setIsOpen(false)}
            >
              Panchang
            </Link>
            <Link
              to="/life-path-number"
              className="text-yellow-400 text-lg font-medium hover:text-yellow-300"
              onClick={() => setIsOpen(false)}
            >
              Life Path Number
            </Link>
            <Link
              to="/astro-list"
              className="text-yellow-400 text-lg font-medium hover:text-yellow-300"
              onClick={() => setIsOpen(false)}
            >
              Chat With Astrologer
            </Link>
            <Link
              to="/how-to-wear"
              className="text-yellow-400 text-lg font-medium hover:text-yellow-300"
              onClick={() => setIsOpen(false)}
            >
              How to wear ?
            </Link>

            {isAuthenticated ? (
              role !== "astrologer" ? (
                <>
                  <Link
                    to="/my-orders"
                    className="text-white text-lg hover:text-purple-500"
                    onClick={() => setIsOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    className="text-white hover:text-purple-400 text-lg flex items-center gap-1"
                  >
                    <Heart className="w-5 h-5" />
                    Wishlist
                  </Link>
                  <Link
                    to="/cart"
                    className="text-white text-lg hover:text-purple-500"
                    onClick={() => setIsOpen(false)}
                  >
                    Cart
                  </Link>
                  <Link
                    to="/wallet"
                    className="flex items-center gap-1 text-white hover:text-purple-500 text-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    <Wallet size={20} /> Wallet
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/astrologer-dashboard"
                    className="text-white text-lg hover:text-purple-500"
                    onClick={() => setIsOpen(false)}
                  >
                    Astrologer Dashboard
                  </Link>
                  <Link
                    to="/astrologer-chat-request"
                    className="text-white text-lg hover:text-purple-500"
                    onClick={() => setIsOpen(false)}
                  >
                    Chat Requests
                  </Link>
                  <Link
                    to="/wallet"
                    className="flex items-center gap-1 text-white hover:text-purple-500 text-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    <Wallet size={20} /> Wallet
                  </Link>
                </>
              )
            ) : null}

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="text-white hover:text-red-500 text-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white text-lg hover:text-purple-500"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/sign-up"
                  className="text-white text-lg hover:text-purple-500"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
            <button onClick={toggleMusic} className="text-white text-lg">
              <Music
                size={20}
                className={`${isPlaying ? "text-yellow-400" : "text-white"}`}
              />
            </button>
          </div>
        )}
      </nav>
      {/* Prevent content from being hidden behind nav */}
      <div className="h-24" />
    </>
  );
};

export default Navbar;
