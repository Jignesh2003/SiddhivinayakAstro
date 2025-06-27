import Order from "../models/Order.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js"; // wherever you configure your Cloudinary SDK

// get products list for user
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .select("-reviews")               // omit reviews if you don’t need them here
      .sort({ createdAt: -1 });         // maybe newest first
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
};

// get single product detail (including reviews)
export const getSingleProductDetail = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("reviews.userId", "name avatar").lean() // bring in user info if desired

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const editAdminProduct = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    price,
    description,
    miniDesc,
    tags,
    category,
    subcategory,
    brand,
    sizeType,
    stock: stockRaw,
  } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Parse stock
    let incomingStock;
    if (typeof stockRaw === "string") {
      try {
        incomingStock = JSON.parse(stockRaw);
      } catch {
        return res.status(400).json({ message: "Invalid stock JSON" });
      }
    } else {
      incomingStock = stockRaw;
    }

    if (!Array.isArray(incomingStock)) {
      return res.status(400).json({ message: "Stock must be an array" });
    }

    // Build final stock array, falling back to old sizes
    const finalStock = incomingStock.map((entry, idx) => {
      const quantity = Number(entry.quantity) || 0;
      let size = entry.size || "";

      if (sizeType !== "Quantity" && !size && product.stock[idx]) {
        size = product.stock[idx].size;
      }

      return { size, quantity };
    });

    // Handle image replacement
    let newImages = product.image.slice();
    let newPublicIds = product.imagePublicId.slice();

    if (req.files && req.files.length) {
      for (let pubId of product.imagePublicId) {
        await cloudinary.uploader.destroy(pubId);
      }
      newImages = req.files.map((f) => f.path);
      newPublicIds = req.files.map((f) => f.filename);
    }

    // Build update object
    const updates = {
      name: name ?? product.name,
      price: price ?? product.price,
      description: description ?? product.description,
      miniDesc: miniDesc ?? product.miniDesc,
      tags: Array.isArray(tags) ? tags : product.tags,
      category: category ?? product.category,
      subcategory: subcategory ?? product.subcategory,
      brand: brand ?? product.brand,
      sizeType: sizeType ?? product.sizeType,
      stock: finalStock,
      image: newImages,
      imagePublicId: newPublicIds,
    };

    const updated = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error("Error in editAdminProduct:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};



// delete a product (admin)
export const deleteAdminProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Remove image from Cloudinary
    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    // Delete product document
    await Product.findByIdAndDelete(id);

    res.json({ message: "Product and its image were deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// admin: mark an order as paid
export const markAsPaid = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: "paid" },
      { new: true }
    );
    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order marked as paid", order: updatedOrder });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
