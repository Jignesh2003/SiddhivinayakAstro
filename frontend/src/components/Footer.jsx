import { useState } from "react";
import { Link } from "react-router-dom";
import assets from "../assets/assets";
import { Facebook, Instagram, Youtube, X, ChevronDown } from "lucide-react";

const Footer = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <footer
      style={{
        backgroundImage: `url(${assets.GalaxyBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="w-full py-6 sm:py-8 text-white text-center shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col items-center space-y-6">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3 mb-2">
          <img
            src={assets.SiddhivinayakAstroLogo}
            alt="Logo"
            className="h-14 w-14 object-contain"
          />
          <span className="text-2xl sm:text-3xl font-bold text-yellow-500 hover:text-gray-300 transition">
            Siddhivinayak Astro
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-base font-medium">
          <Link
            to="/about-us"
            className="text-white hover:text-yellow-400 transition"
          >
            About Us
          </Link>
          <Link
            to="/contact-us"
            className="text-white hover:text-yellow-400 transition"
          >
            Contact
          </Link>
          <Link
            to="/blog-list"
            className="text-white hover:text-yellow-400 transition"
          >
            Blogs
          </Link>
          <Link
            to="/astro-list"
            className="text-white hover:text-yellow-400 transition"
          >
            Chat With Astrologer
          </Link>
          <Link
            to="/partners"
            className="text-white hover:text-yellow-400 transition"
          >
            Partners
          </Link>

          {/* Dropdown for Policies */}
          <div className="relative inline-block">
            <button
              className="flex items-center text-white hover:text-yellow-400 transition focus:outline-none"
              onClick={() => setDropdownOpen((open) => !open)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              Policies
              <ChevronDown size={18} className="ml-1" />
            </button>
            <div
              className={`absolute left-0 mt-2 min-w-[180px] bg-gray-800 rounded shadow-lg text-left z-10 transition-all duration-300 ${
                dropdownOpen ? "block" : "hidden"
              }`}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <Link
                to="/private-info"
                className="block px-4 py-2 text-white hover:bg-yellow-400 hover:text-black transition"
                onClick={() => setDropdownOpen(false)}
              >
                Privacy Policy
              </Link>
              <Link
                to="/tmc"
                className="block px-4 py-2 text-white hover:bg-yellow-400 hover:text-black transition"
                onClick={() => setDropdownOpen(false)}
              >
                Terms & Conditions
              </Link>
              <Link
                to="/cancellation-policy"
                className="block px-4 py-2 text-white hover:bg-yellow-400 hover:text-black transition"
                onClick={() => setDropdownOpen(false)}
              >
                Cancellation and Refund
              </Link>
              <Link
                to="/shipping-policy"
                className="block px-4 py-2 text-white hover:bg-yellow-400 hover:text-black transition"
                onClick={() => setDropdownOpen(false)}
              >
                Shipping and Delivery
              </Link>
            </div>
          </div>
        </nav>

        {/* Social Media Links */}
        <div className="flex justify-center space-x-5 pt-1">
          <a
            href="https://www.facebook.com/profile.php?id=61573576634237"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Facebook size={26} className="hover:text-yellow-400 transition" />
          </a>
          <a
            href="https://www.instagram.com/siddhivinayak_astro?igsh=MTJ1dmwyOTU4OXN4aQ=="
            target="_blank"
            rel="noopener noreferrer"
          >
            <Instagram size={26} className="hover:text-yellow-400 transition" />
          </a>
          <a
            href="https://www.youtube.com/@siddhivinayak_astro"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Youtube size={26} className="hover:text-yellow-400 transition" />
          </a>
          <a
            href="https://x.com/SiddhiVinayak33"
            target="_blank"
            rel="noopener noreferrer"
          >
            <X size={26} className="hover:text-yellow-400 transition" />
          </a>
        </div>

        {/* Copyright Notice */}
        <p className="text-xs sm:text-sm opacity-75 mt-3">
          &copy; {new Date().getFullYear()} Siddhivinayak Astro. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
