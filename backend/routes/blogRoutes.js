import express from "express";
import Blog from "../models/blog.js";
import { createBlog, deleteBlog, getBlog, getSingleBlog, updateBlog } from "../controllers/blogController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadBlogImages } from "../middlewares/multer.js";

const router = express.Router();

router.get("/posts",getBlog)
router.get("/posts/:id",getSingleBlog)
router.post("/posts",authMiddleware,uploadBlogImages, createBlog)
router.put("/posts/:id",authMiddleware, uploadBlogImages, updateBlog)
router.delete("/posts/:id",authMiddleware, deleteBlog)

export default router;