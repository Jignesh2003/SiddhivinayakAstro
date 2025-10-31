import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  // Legacy size field (for non-variant products)
  size: {
    type: String,
    default: null,
  },
  // 🆕 Variant support
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  variant: {
    variantName: String,
    gram: Number,
    price: Number,
    stock: Number,
    sku: String,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

// Index for faster queries

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
