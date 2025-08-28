// Requires: express, body-parser, mongoose, cors
import express from "express"
import Blog from "../models/blog.js";
import cloudinary from "../config/cloudinary.js";


// Get all blogs
export const getBlog = async(req, res) => {
    try {
    const posts = await Blog.find().sort({ publishedAt: -1 });
  res.status(200).json(posts)
} catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error while getting blog !" });
    
}}

// Get one blog by ID
export const getSingleBlog = async(req, res) => {try {
      const post = await Blog.findById(req.params.id);
     res.status(200).json(post);
} catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error while getting single blog !" });
}}


export const createBlog = async (req, res) => {
  try {
    // Multer puts upload info in req.files
    if (req.files && req.files.length > 0) {
      req.body.image = req.files.map((file) => file.path); // URLs
      req.body.imagePublicId = req.files.map((file) => file.filename); // Cloudinary public_ids
      req.body.featuredImage = req.body.image[0]; // First image as featured
    }

    const post = new Blog(req.body);
    const saved = await post.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error while creating blog !" });
  }
};

export const updateBlog = async (req, res) => {
  try {
    if (req.files && req.files.length > 0) {
      req.body.image = req.files.map((file) => file.path);
      req.body.imagePublicId = req.files.map((file) => file.filename);
      req.body.featuredImage = req.body.image[0];
    }

    const updated = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error while updating blog !" });
  }
};


// Delete blog
export const deleteBlog = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Delete images from Cloudinary using their public_ids
    if (post.imagePublicId?.length > 0) {
      await Promise.all(
        post.imagePublicId.map(async (publicId) => {
try {
  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
  });
  if (result.result !== "ok") {
    console.warn("Cloudinary destroy failed:", publicId, result);
  } else {
    console.log("Successfully deleted image:", publicId);
  }
} catch (err) {
  console.warn("Error deleting Cloudinary image:", publicId, err.message);
}

        })
      );
    }

    // Delete the blog post from DB
    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Deleted blog and images" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error while deleting blog!" });
  }
};


