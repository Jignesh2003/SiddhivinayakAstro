import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // Default MongoDB ObjectId _id
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],

    totalAmount: { type: Number, required: true },
    gstAmount: { type: Number, required: true }, // calculated GST total
    deliveryCharges: { type: Number, default: 0 }, // delivery fees

    // ── New field to store your Cashfree string ID ──
    customOrderId: {
      type: String,
      index: true, // index for fast lookups in webhook
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Initiated"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Shipped",
        "Processing",
        "Out-for-delivery",
        "Delivered",
        "Cancelled",
        "On-way",
      ],
      default: "Pending",
    },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" }, // reference to Coupon if used
    discountAmount: { type: Number, default: 0 }, // actual discount given in this order

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
