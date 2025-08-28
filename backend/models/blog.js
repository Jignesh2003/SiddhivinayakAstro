import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  description: String,
  author: {
    type: String,
    required: false,
  },
  image: [{ type: String }],
  imagePublicId: [{ type: String }],
  tags: [String],
  categories: [String],
  comments: [CommentSchema],
  featuredImage: String,
  publishedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  metadata: {
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
});

const Blog = mongoose.model("Blog", BlogSchema);
export default Blog;
