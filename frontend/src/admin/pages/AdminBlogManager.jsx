import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "@/store/useAuthStore";

const AdminBlogManager = () => {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({
    title: "",
    content: "",
    description: "",
    author: "",
    tags: "",
    categories: "",
  });
  const { token } = useAuthStore.getState();
  const [editingId, setEditingId] = useState(null);
  const [images, setImages] = useState([]); // For file inputs
  const [previewUrls, setPreviewUrls] = useState([]); // For image previews

  // Fetch all posts
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BLOG_URL}/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to fetch posts", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle image file selection and preview
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);

    // Create array of preview URLs
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare form data for multipart/form-data upload
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("content", form.content);
      formData.append("description", form.description);
      formData.append("author", form.author);
      formData.append("tags", form.tags);
      formData.append("categories", form.categories);

      // Append image files to form data
      images.forEach((file) => {
        formData.append("images", file);
      });

      let response;

      if (editingId) {
        response = await axios.put(
          `${import.meta.env.VITE_BLOG_URL}/posts/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setEditingId(null);
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_BLOG_URL}/posts`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      // Reset form and images after success
      setForm({
        title: "",
        content: "",
        description: "",
        author: "",
        tags: "",
        categories: "",
      });
      setImages([]);
      setPreviewUrls([]);

      fetchPosts();
    } catch (err) {
      console.error("Failed to submit", err);
    }
  };

  const handleEdit = (post) => {
    setEditingId(post._id);
    setForm({
      title: post.title || "",
      content: post.content || "",
      description: post.description || "",
      author: post.author || "",
      tags: post.tags?.join(", ") || "",
      categories: post.categories?.join(", ") || "",
    });
    setImages([]);
    setPreviewUrls(post.image || []); // Show existing images if any
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_BLOG_URL}/posts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchPosts();
      } catch (err) {
        console.error("Failed to delete", err);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-md shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Admin Blog Manager
      </h2>

      <form
        onSubmit={handleSubmit}
        className="mb-10 space-y-6"
        encType="multipart/form-data"
      >
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <textarea
          name="content"
          placeholder="Content (HTML supported)"
          value={form.content}
          onChange={handleChange}
          required
          rows={6}
          className="w-full px-4 py-3 border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="text"
          name="author"
          placeholder="Author Name"
          value={form.author}
          onChange={handleChange}
          className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="text"
          name="tags"
          placeholder="Tags (comma separated)"
          value={form.tags}
          onChange={handleChange}
          className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="text"
          name="categories"
          placeholder="Categories (comma separated)"
          value={form.categories}
          onChange={handleChange}
          className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* Image upload input */}
        <div>
          <label className="block mb-2 font-semibold">
            Upload Images (max 1)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        {/* Image previews */}
        <div className="flex flex-wrap mt-4 gap-3">
          {previewUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt="Preview"
              className="h-24 w-24 rounded-md object-cover border border-gray-300"
            />
          ))}
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition"
          >
            {editingId ? "Update Post" : "Create Post"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({
                  title: "",
                  content: "",
                  description: "",
                  author: "",
                  tags: "",
                  categories: "",
                });
                setImages([]);
                setPreviewUrls([]);
              }}
              className="px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        {posts?.map((post) => (
          <div
            key={post?._id}
            className="border-b border-gray-200 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center"
          >
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {post?.title}
              </h3>
              <p className="text-gray-600 my-1">{post?.description}</p>
              <small className="text-gray-500">
                By: {post?.author || "Unknown"}
              </small>
            </div>

            <div className="mt-3 sm:mt-0 flex space-x-3">
              <button
                onClick={() => handleEdit(post)}
                className="px-4 py-2 bg-yellow-400 text-yellow-900 font-semibold rounded-md hover:bg-yellow-500 transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(post._id)}
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBlogManager;
