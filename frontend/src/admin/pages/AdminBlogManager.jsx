import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "@/store/useAuthStore";

// Tiptap imports
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

const AdminBlogManager = () => {
  const { token } = useAuthStore.getState();
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({
    title: "",
    content: "",
    description: "",
    author: "",
    tags: "",
    categories: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [images, setImages] = useState([]); // optional extra images
  const [previewUrls, setPreviewUrls] = useState([]);

  // Tiptap editor setup
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: form.content,
    onUpdate: ({ editor }) => setForm({ ...form, content: editor.getHTML() }),
  });

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

  // Optional extra images for the post
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  // Upload image from local files to editor as base64
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const base64 = readerEvent.target.result;
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("content", form.content); // HTML from Tiptap
      formData.append("description", form.description);
      formData.append("author", form.author);
      formData.append("tags", form.tags);
      formData.append("categories", form.categories);

      images.forEach((file) => formData.append("images", file));

      if (editingId) {
        await axios.put(
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
        await axios.post(`${import.meta.env.VITE_BLOG_URL}/posts`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

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
      editor.commands.setContent(""); // clear editor
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
    setPreviewUrls(post.images || []);
    editor.commands.setContent(post.content || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
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

      <form onSubmit={handleSubmit} className="mb-10 space-y-6">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* Tiptap editor */}
        <div>
          <label className="block mb-2 font-semibold">Content</label>
          <div className="flex gap-2 mb-2 items-center">
            {/* Image upload button */}
            <label className="px-2 py-1 bg-indigo-600 text-white rounded cursor-pointer">
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="px-2 py-1 bg-gray-300 rounded"
            >
              Bold
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="px-2 py-1 bg-gray-300 rounded"
            >
              Italic
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className="px-2 py-1 bg-gray-300 rounded"
            >
              H2
            </button>
          </div>
          <div className="border rounded-md p-2">
            <EditorContent editor={editor} />
          </div>
        </div>

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
                editor.commands.setContent("");
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

      {/* Posts list */}
      <div>
        {posts?.map((post) => (
          <div
            key={post._id}
            className="border-b border-gray-200 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center"
          >
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {post.title}
              </h3>
              <p className="text-gray-600 my-1">{post.description}</p>
              <small className="text-gray-500">
                By: {post.author || "Unknown"}
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
