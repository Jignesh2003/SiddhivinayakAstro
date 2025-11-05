import Order from "../models/Order.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

// Get products list for user
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .select("-reviews") // omit reviews
      .sort({ createdAt: -1 }) // newest first
      .lean(); // Convert to plain objects for better performance

    // Add computed fields that would normally be virtuals
    const enrichedProducts = products.map(product => {
      // Calculate total stock
      let totalStock = 0;
      if (product.hasVariants && Array.isArray(product.variants)) {
        totalStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      } else if (Array.isArray(product.stock)) {
        totalStock = product.stock.reduce((sum, s) => sum + (s.quantity || 0), 0);
      }

      return {
        ...product,
        totalStock, // Add computed totalStock field
      };
    });

    res.json(enrichedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
};


// Get single product detail (including reviews)
export const getSingleProductDetail = async (req, res) => {
  try {
    // Don't use .lean() because we need virtuals (totalStock, priceRange, defaultVariant)
    const product = await Product.findById(req.params.id)
      .populate("reviews.userId", "name avatar");

    if (!product) return res.status(404).json({ message: "Product not found" });

    // Convert to object to include virtuals
    const productObj = product.toObject();

    res.status(200).json(productObj);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Edit product (admin) - UPDATED WITH VARIANTS SUPPORT
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
    howToWear,
    benefits,
    bestDayToWear,
    // NEW FIELDS FOR VARIANTS
    hasVariants,
    variants: variantsRaw,
  } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Helper function to parse array fields
    function parseArrayField(field, fallback = []) {
      if (!field) return fallback;
      if (Array.isArray(field)) return field;
      try {
        return JSON.parse(field);
      } catch {
        return fallback;
      }
    }

    // Parse tags, howToWear, benefits, bestDayToWear
    const parsedTags = parseArrayField(tags, product.tags);
    const parsedHowToWear = parseArrayField(howToWear, product.howToWear);
    const parsedBenefits = parseArrayField(benefits, product.benefits);
    const parsedBestDayToWear = parseArrayField(bestDayToWear, product.bestDayToWear);

    // NEW: Parse variants if product uses variant system
    let parsedVariants = product.variants;
    const useVariants = hasVariants === true || hasVariants === "true";

    if (useVariants && variantsRaw) {
      try {
        parsedVariants = typeof variantsRaw === "string"
          ? JSON.parse(variantsRaw)
          : variantsRaw;
      } catch {
        return res.status(400).json({ message: "Invalid variants JSON" });
      }

      if (!Array.isArray(parsedVariants)) {
        return res.status(400).json({ message: "Variants must be an array" });
      }
    }

    // Parse legacy stock (for products without variants)
    let finalStock = product.stock;
    if (!useVariants && stockRaw) {
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
      finalStock = incomingStock.map((entry, idx) => {
        const quantity = Number(entry.quantity) || 0;
        let size = entry.size || "";

        if (sizeType !== "Quantity" && !size && product.stock[idx]) {
          size = product.stock[idx].size;
        }

        return { size, quantity };
      });
    }

    // Handle image replacement
    let newImages = product.image.slice();
    let newPublicIds = product.imagePublicId.slice();

    if (req.files && req.files.length) {
      // Delete old images from Cloudinary
      if (product.imagePublicId && product.imagePublicId.length > 0) {
        for (let pubId of product.imagePublicId) {
          if (pubId && pubId.trim() !== "") {
            await cloudinary.uploader.destroy(pubId);
          }
        }
      }

      newImages = req.files.map((f) => f.path);
      newPublicIds = req.files.map((f) => f.filename);
    }

    // Build update object
    const updates = {
      name: name ?? product.name,
      description: description ?? product.description,
      miniDesc: miniDesc ?? product.miniDesc,
      tags: parsedTags,
      category: category ?? product.category,
      subcategory: subcategory ?? product.subcategory,
      brand: brand ?? product.brand,
      howToWear: parsedHowToWear,
      benefits: parsedBenefits,
      bestDayToWear: parsedBestDayToWear,
      image: newImages,
      imagePublicId: newPublicIds,
      // NEW: Add variants support
      hasVariants: useVariants,
    };

    // Add variant-specific or legacy-specific fields
    if (useVariants) {
      updates.variants = parsedVariants;
      // Don't update legacy fields when using variants
    } else {
      updates.price = price ?? product.price;
      updates.sizeType = sizeType ?? product.sizeType;
      updates.stock = finalStock;
      // Clear variants if switching back to legacy
      updates.variants = undefined;
    }

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
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// Delete a product (admin)
export const deleteAdminProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    console.log("imagePublicId:", product.imagePublicId);

    // Remove main product images from Cloudinary
    if (Array.isArray(product.imagePublicId) && product.imagePublicId.length) {
      for (const publicId of product.imagePublicId) {
        if (typeof publicId === "string" && publicId.trim() !== "") {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    // NEW: Remove variant-specific images from Cloudinary
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (variant.imagePublicId && variant.imagePublicId.trim() !== "") {
          await cloudinary.uploader.destroy(variant.imagePublicId);
        }
      }
    }

    // Delete product document from database
    await Product.findByIdAndDelete(id);

    res.json({
      message: "Product and its image(s) were deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin: mark an order as paid
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

// NEW: Get product stock by variant (helper for cart/checkout)
export const getProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { variantId, size } = req.query;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let stockInfo = {};

    if (product.hasVariants && product.variants) {
      // Find stock for specific variant
      const variant = variantId
        ? product.variants.id(variantId)
        : product.variants[0];

      if (variant) {
        stockInfo = {
          stock: variant.stock,
          price: variant.price,
          variantId: variant._id,
          variantName: variant.variantName,
        };
      }
    } else if (product.stock) {
      // Legacy stock system
      const stockItem = size
        ? product.stock.find(s => s.size === size)
        : product.stock[0];

      if (stockItem) {
        stockInfo = {
          stock: stockItem.quantity,
          price: product.price,
          size: stockItem.size,
        };
      }
    }

    res.status(200).json(stockInfo);
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).json({ message: "Server error" });
  }
};
