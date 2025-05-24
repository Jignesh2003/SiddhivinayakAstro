import { Link } from "react-router-dom";
import assets from "../assets/assets";
import { Facebook, Instagram, Youtube, X } from "lucide-react";

const Footer = () => {
  return (
    <footer
      style={{
        backgroundImage: `url(${assets.GalaxyBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="w-full py-4 text-white text-center shadow-md"
    >
      {/* Footer Container */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col items-center space-y-4">
        
        {/* Logo & Brand Name */}
        <Link to="/" className="flex items-center space-x-3">
          <img
            src={assets.SiddhivinayakAstroLogo}
            alt="Logo"
            className="h-16 w-16 object-contain"
          />
          <span className="text-2xl font-bold text-yellow-500 hover:text-gray-300 transition">
            Siddhivinayak Astro
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
          <Link to="/about-us" className="text-white hover:text-yellow-400 transition">About Us</Link>
          <Link to="/contact-us" className="text-white hover:text-yellow-400 transition">Contact</Link>
          <Link to="/private-info" className="text-white hover:text-yellow-400 transition">Privacy Policy</Link>
          <Link to="/tmc" className="text-white hover:text-yellow-400 transition">Terms & Conditions</Link>
          <Link to="/partners" className="text-white hover:text-yellow-400 transition">Partners</Link>
          <Link to="/blogs-astrology-and-you" className="text-white hover:text-yellow-400 transition">Blogs</Link>
          <Link to="/astro-list" className="text-white hover:text-yellow-400 transition">Chat With Astrologer</Link>

        </nav>

        {/* Social Media Links */}
        <div className="flex space-x-5">
          <a href="https://www.facebook.com/profile.php?id=61573576634237" target="_blank" rel="noopener noreferrer">
            <Facebook size={24} className="hover:text-yellow-400 transition" />
          </a>
          <a href="https://www.instagram.com/siddhivinayak_astro?igsh=MTJ1dmwyOTU4OXN4aQ==" target="_blank" rel="noopener noreferrer">
            <Instagram size={24} className="hover:text-yellow-400 transition" />
          </a>
          <a href="https://www.youtube.com/@siddhivinayak_astro" target="_blank" rel="noopener noreferrer">
            <Youtube size={24} className="hover:text-yellow-400 transition" />
          </a>
          <a href="https://x.com/SiddhiVinayak33" target="_blank" rel="noopener noreferrer">
            <X size={24} className="hover:text-yellow-400 transition" />
          </a>
        </div>

        {/* Copyright Notice */}
        <p className="text-sm opacity-75">&copy; {new Date().getFullYear()} Siddhivinayak Astro. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;