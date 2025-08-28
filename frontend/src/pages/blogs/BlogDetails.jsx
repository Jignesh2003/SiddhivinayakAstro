import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, User } from "lucide-react";
import assets from "@/assets/assets";

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [blogs, setBlogs] = useState([]);

  // Fetch single blog details
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

  // Fetch all blogs for related posts
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

  if (!blog)
    return (
      <div className="text-center mt-20 text-lg text-gray-500 font-medium">
        Loading...
      </div>
    );

  const relatedBlogs = blogs.filter((b) => b._id !== id).slice(0, 3);

  return (
    <div
      className="max-w-5xl mx-auto p-10 bg-white rounded-2xl shadow-2xl prose prose-indigo prose-lg xl:prose-xl 2xl:prose-2xl dark:prose-invert"
      style={{
        backgroundImage: `url(${assets.HeroSelectionBackground})`,
        backgroundSize: "cover",backgroundRepeat: "no-repeat", backgroundPosition: "center",
      }}
    >
      {/* Featured Image */}
      {blog.featuredImage && (
        <div className="overflow-hidden rounded-2xl shadow-lg mb-12 ">
          <img
            src={blog.featuredImage}
            alt={blog.title}
            className="w-full h-[450px] object-contain transition-transform duration-300 hover:scale-105 rounded-2xl"
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-5xl font-extrabold tracking-tight mb-8 text-amber-50 drop-shadow-md">
        {blog.title}
      </h1>

      {/* Author & Date */}
      <div className="flex flex-wrap items-center space-x-5 text-gray-600 text-lg mb-14">
        <div className="flex items-center space-x-3">
          <User className="w-6 h-6 text-amber-50" />
          <span className="font-semibold">
            {blog.author || "Unknown Author"}
          </span>
        </div>
        <span className="border-l border-gray-300 h-6 align-middle"></span>
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-amber-50" />
          <time dateTime={blog.publishedAt} className="font-medium">
            {new Date(blog.publishedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </div>

      {/* Content */}
      <article
        className="prose max-w-none text-amber-50 dark:text-gray-100"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Related Blogs */}
      {relatedBlogs.length > 0 && (
        <section className="mt-20">
          <h2 className="text-4xl font-bold mb-8 text-amber-50 border-b border-indigo-300 pb-4">
            Related Posts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {relatedBlogs.map(({ _id, title, description, featuredImage }) => (
              <div
                key={_id}
                className=" rounded-2xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition duration-300"
                style={{
                  backgroundImage: `url(${assets.HeroSelectionBackground})`,
                }}
              >
                {featuredImage && (
                  <img
                    src={featuredImage}
                    alt={title}
                    className="h-80 w-180 object-contain rounded-xl mb-6 "
                  />
                )}
                <h3 className="text-2xl font-semibold text-amber-50 mb-4 truncate ">
                  {title}
                </h3>
                <p className="text-amber-100 line-clamp-3 mb-6 font-light">
                  {description || "No description available."}
                </p>
                <button
                  onClick={() => navigate(`/blog-details/${_id}`)}
                  className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
                  aria-label={`Read more about ${title}`}
                >
                  Read More
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mt-20 inline-flex items-center px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition focus:outline-none focus:ring-4 focus:ring-indigo-400 focus:ring-offset-2"
        aria-label="Back to blog list"
      >
        <ArrowLeft className="w-6 h-6 mr-3" />
        Back to List
      </button>
    </div>
  );
};

export default BlogDetail;
