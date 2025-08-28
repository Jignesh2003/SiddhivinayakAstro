import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

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
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
        Blog Posts
      </h1>
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog) => (
          <Link
            key={blog._id}
            to={`/blog-details/${blog._id}`}
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-xl transition block"
          >
            {blog.featuredImage && (
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="rounded-md mb-4 w-full h-48 object-contain"
              />
            )}
            <h2 className="text-xl font-semibold mb-2 text-indigo-600 hover:underline">
              {blog.title}
            </h2>
            <p className="text-gray-600 line-clamp-3">
              {blog.description || "No description"}
            </p>
            <div className="mt-3 text-sm text-gray-400">
              By: {blog.author || "Unknown"} |{" "}
              {new Date(blog.publishedAt).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BlogList;
