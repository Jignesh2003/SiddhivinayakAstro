import mongoose from "mongoose";
import Counter from "./counter.js";

// Variant schema for products with different options
const variantSchema = new mongoose.Schema(
  {
    variantName: {
      type: String,
      trim: true,
      required: [true, "Variant name is required"],
    },
    gram: {
      type: Number,
      min: [0.1, "Gram must be positive"],
    },
    price: {
      type: Number,
      required: [true, "Price is required for each variant"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    sku: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const stockItemSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String },
    media: { type: String },
  },
  { timestamps: true, _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    description: { type: String, required: true },
    tags: [{ type: String }],
    miniDesc: { type: String },
    price: { type: Number, min: 0 }, // Only required if hasVariants = false
    category: {
      type: String,
      required: true,
      enum: [
        "Gifts",
        "Gemstones",
        "Necklaces",
        "Rings",
        "Bracelets",
        "Puja Samagri",
        "Turtle",
        "Rudraksha",
        "Murti",
        "Kavach",
        "Siddh Rudraksha",
        "Yantras",
        "Evil Eye",
        "Combos",
        "Pyrite",
        "Pendants",
        "Money Magnet",
        "Pyramids",
        "Home Decor",
        "Stone", 
        "Customized",
      ],
    },
    subcategory: String,
    brand: String,
    sizeType: {
      type: String,
      enum: ["Ring", "Quantity", "Mukhi", "Gemstone"],
      default: "Quantity",
    },
    // UPDATED: Make stock conditional based on hasVariants
    stock: {
      type: [stockItemSchema],
      default: undefined, // Don't set default empty array
      validate: {
        validator: function (arr) {
          // Only validate if hasVariants is false
          if (this.hasVariants === false) {
            return Array.isArray(arr) && arr.length > 0;
          }
          // If hasVariants is true, stock can be undefined or empty
          return true;
        },
        message: "Stock must have at least one entry for non-variant products",
      },
    },
    image: [{ type: String }],
    imagePublicId: [{ type: String }],
    reviews: [reviewSchema],
    productNumber: { type: Number, unique: true },
    featured: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    howToWear: [{ type: String }],
    benefits: [{ type: String }],
    bestDayToWear: [{ type: String }],
    // NEW: Variant support
    hasVariants: {
      type: Boolean,
      default: false,
    },
    variants: {
      type: [variantSchema],
      default: undefined, // Don't set default empty array
      validate: {
        validator: function (arr) {
          // Only validate if hasVariants is true
          if (this.hasVariants === true) {
            return Array.isArray(arr) && arr.length > 0;
          }
          // If hasVariants is false, variants can be undefined or empty
          return true;
        },
        message: "At least one variant is required when hasVariants is true",
      },
    },
  },
  { timestamps: true }
);

// Add indexes
productSchema.index({ category: 1, featured: -1, priority: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ hasVariants: 1 });

// Auto-increment productNumber
productSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        "productNumber",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.productNumber = counter.seq;
    } catch (error) {
      return next(error);
    }
  }

  // Auto-set hasVariants flag based on variants array
  if (this.variants && this.variants.length > 0) {
    this.hasVariants = true;
  }

  next();
});

// Virtual to get total stock (works for both legacy and variant products)
productSchema.virtual("totalStock").get(function () {
  if (this.hasVariants && this.variants && this.variants.length > 0) {
    return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  } else if (this.stock && this.stock.length > 0) {
    return this.stock.reduce((sum, s) => sum + (s.quantity || 0), 0);
  }
  return 0;
});

// Virtual to get price range for variant products
productSchema.virtual("priceRange").get(function () {
  if (this.hasVariants && this.variants && this.variants.length > 0) {
    const prices = this.variants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return { min: minPrice, max: maxPrice, display: `₹${minPrice}` };
    }
    return { min: minPrice, max: maxPrice, display: `₹${minPrice} - ₹${maxPrice}` };
  } else if (this.price) {
    return { min: this.price, max: this.price, display: `₹${this.price}` };
  }
  return null;
});

// Virtual to get default variant
productSchema.virtual("defaultVariant").get(function () {
  if (!this.hasVariants || !this.variants || this.variants.length === 0) {
    return null;
  }
  return this.variants.find((v) => v.isDefault) || this.variants[0];
});

// Enable virtuals in JSON/Object output
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default mongoose.models.Product || mongoose.model("Product", productSchema);
