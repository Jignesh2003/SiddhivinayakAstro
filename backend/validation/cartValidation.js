import Joi from "joi";
import mongoose from "mongoose";

// Custom ObjectId validator
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

// Add to Cart
export const addToCartSchema = Joi.object({
  product: objectId.required(),
  quantity: Joi.number().integer().min(1).default(1),
  size: Joi.string().optional(), // Legacy
  variantId: objectId.optional(), // 🆕
  variant: Joi.object().optional(), // 🆕
});

// Update Cart
export const updateCartSchema = Joi.object({
  productId: objectId.required(),
  quantity: Joi.number().integer().min(1).required(),
  size: Joi.string().optional(), // Legacy
  variantId: objectId.optional(), // 🆕
});

// Remove from Cart
export const removeFromCartSchema = Joi.object({
  userId: objectId.required(),
  productId: objectId.required(),
  size: Joi.string().optional(), // Legacy
  variantId: objectId.optional(), // 🆕
});

// Clear Cart
export const clearCartSchema = Joi.object({
  userId: objectId.required(),
});
