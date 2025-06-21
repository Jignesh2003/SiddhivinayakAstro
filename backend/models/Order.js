import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // ✅ Added reference
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay", "stripe"],
      default: "cod", // ✅ Default value added
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Shipped", "Out-for-delivery", "Delivered", "Cancelled","On-way"], // ✅ Fixed "on-way" to "out-for-delivery"
      default: "Pending",
    },

    // ✅ Shipping Address
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
