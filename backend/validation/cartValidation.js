// validations/cartValidations.js
import Joi from "joi";
import mongoose from "mongoose";

// 🔧 Custom ObjectId validator
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

// 📌 Add to Cart
export const addToCartSchema = Joi.object({
  product: objectId.required(),
  quantity: Joi.number().integer().min(1).default(1),
});

// 📌 Update Cart
export const updateCartSchema = Joi.object({
  productId: objectId.required(),
  quantity: Joi.number().integer().min(1).required(),
});

// 📌 Remove from Cart (from query and params)
export const removeFromCartSchema = Joi.object({
  userId: objectId.required(),
  productId: objectId.required(),
});

// 📌 Clear Cart
export const clearCartSchema = Joi.object({
  userId: objectId.required(),
});
