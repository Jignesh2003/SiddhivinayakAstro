import Joi from "joi";
import mongoose from "mongoose";

// Helper to validate ObjectId format
const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

// 🔸 Used in placeOrder controller
export const placeOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string().custom(objectIdValidator, "ObjectId validation").required(),
        quantity: Joi.number().integer().min(1).required(),
        size: Joi.string().optional(),
      })
    )
    .min(1)
    .required(),
  totalAmount: Joi.number().min(0).required(),
  paymentMethod: Joi.string().valid("cod", "online").required(),
  shippingAddress: Joi.object({
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().optional().allow(""),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    postalCode: Joi.string().required(),
  }).required(),
});

// 🔸 Used in updateOrderStatus controller
export const updateOrderStatusSchema = Joi.object({
  orderId: Joi.string().custom(objectIdValidator, "ObjectId validation").required(),
  status: Joi.string().valid("pending", "confirmed", "shipped", "delivered", "cancelled").required(),
});
