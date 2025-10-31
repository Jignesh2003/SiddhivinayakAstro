import Joi from "joi";
import mongoose from "mongoose";

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

// Place Order
export const placeOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string().custom(objectIdValidator).required(),
        quantity: Joi.number().integer().min(1).required(),
        size: Joi.string().optional(), // Legacy
        variantId: Joi.string().custom(objectIdValidator).optional(), // 🆕
        variant: Joi.object().optional(), // 🆕
        price: Joi.number().min(0).required(), // 🆕
      })
    )
    .min(1)
    .required(),
  totalAmount: Joi.number().min(0).required(),
  gstAmount: Joi.number().min(0).optional(), // 🆕
  deliveryCharges: Joi.number().min(0).optional(), // 🆕
  paymentMethod: Joi.string().valid("cod", "online").required(),
  shippingAddress: Joi.object({
    name: Joi.string().required(), // 🆕
    phone: Joi.string().required(), // 🆕
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().required(),
    landmark: Joi.string().optional(), // 🆕
  }).required(),
});

// Update Order Status
export const updateOrderStatusSchema = Joi.object({
  orderId: Joi.string().custom(objectIdValidator).required(),
  status: Joi.string()
    .valid("Pending", "Processing", "Shipped", "On-way", "Out-for-delivery", "Delivered", "Cancelled")
    .required(),
});
