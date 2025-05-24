import { Link } from "react-router-dom";

const BlogNavbar = () => {
  return (
    <nav className="bg-black bg-opacity-90 py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between">
        <h1 className="text-white text-2xl font-bold">Astrology Blogs</h1>
        <div className="flex space-x-6">
          <Link to="/blogs-astrology-and-you" className="text-white hover:text-yellow-500 text-lg">Astrology & You</Link>
          <Link to="/blogs-power-of-meditation" className="text-white hover:text-yellow-500 text-lg">Power of Meditation</Link>
          <Link to="/blogs-sacred-yantras" className="text-white hover:text-yellow-500 text-lg">Sacred Yantras</Link>
          <Link to="/blogs-zodiac-signs" className="text-white hover:text-yellow-500 text-lg">Zodiac Signs</Link>
          <Link to="/blogs-planetary-influence" className="text-white hover:text-yellow-500 text-lg">Planetary Influence</Link>
        </div>
      </div>
    </nav>
  );
};

export default BlogNavbar;
