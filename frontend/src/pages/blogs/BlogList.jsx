import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import assets from "@/assets/assets";

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BLOG_URL}/posts`);
        setBlogs(res.data);
      } catch (err) {
        console.error("Error fetching blogs:", err);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="bg-gradient-to-tr from-indigo-900 via-purple-800 to-indigo-900 min-h-screen flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-7xl bg-black/70 rounded-3xl shadow-2xl p-10 backdrop-blur-xl">
        {/* Hero Image & Heading */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg mb-12">
          <img
            src={assets.HeroSelectionBackground}
            alt="Astrology Stars Background"
            className="w-full h-64 object-cover brightness-75 backdrop-blur-lg"
          />
          <h1 className="absolute inset-0 flex items-center justify-center text-5xl font-extrabold text-amber-300 drop-shadow-lg font-serif">
            Explore Astrology & Cosmic Wisdom
          </h1>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
          {blogs.map((blog) => (
            <Link
              to={`/blog-details/${blog._id}`}
              key={blog._id}
              className="flex flex-col bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 rounded-xl shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-2xl"
              aria-label={`Read astrology article: ${blog.title}`}
            >
              {blog.featuredImage ? (
                <img
                  src={blog.featuredImage}
                  alt={blog.title}
                  className="h-48 w-full object-cover border-b border-amber-400"
                />
              ) : (
                <div className="h-48 w-full bg-purple-700 border-b border-amber-400 flex items-center justify-center text-amber-400 font-semibold">
                  No Image Available
                </div>
              )}
              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-xl font-semibold text-amber-300 mb-3 font-serif truncate hover:underline">
                  {blog.title}
                </h2>
                <p className="flex-1 text-gray-300 text-sm line-clamp-4 mb-6 font-light">
                  {blog.description ||
                    "Dive into cosmic mysteries and insights..."}
                </p>
                <div className="flex justify-between text-xs text-amber-400 font-mono tracking-widest">
                  <span>By {blog.author || "Astro Sage"}</span>
                  <time dateTime={blog.publishedAt}>
                    {new Date(blog.publishedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-14 text-center text-amber-400 font-mono tracking-wide font-semibold">
          &copy; {new Date().getFullYear()} SV ASTRO PVT LIMITED. All Rights
          Reserved.
        </footer>
      </div>
    </div>
  );
};

export default BlogList;
