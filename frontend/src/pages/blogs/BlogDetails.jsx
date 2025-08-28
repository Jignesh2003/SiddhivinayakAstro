import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BLOG_URL}/posts/${id}`
        );
        setBlog(res.data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error("Error fetching blog:", err);
      }
    };
    fetchBlog();
  }, [id]);

  if (!blog) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-md shadow-lg prose">
      <h2 className="text-3xl font-bold mb-4 text-indigo-700">{blog.title}</h2>
      <p className="text-sm text-gray-500 mb-6">
        By {blog.author || "Unknown"} |{" "}
        {new Date(blog.publishedAt).toLocaleDateString()}
      </p>
      {blog.featuredImage && (
        <img
          src={blog.featuredImage}
          alt={blog.title}
          className="rounded-md mb-6 w-full max-h-96 object-contain"
        />
      )}
      <div
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
      <button
        onClick={() => navigate(-1)}
        className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
      >
        Back to List
      </button>
    </div>
  );
};

export default BlogDetail;
