import mongoose from "mongoose";

//  Order Item Schema with Variant Support
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // Legacy size field (for non-variant products)
  size: {
    type: String,
    default: null,
  },
  // Variant support
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  variant: {
    variantName: String,
    gram: Number,
    price: Number,
    sku: String,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [orderItemSchema], // Using the new schema with variant support

    totalAmount: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    deliveryCharges: { type: Number, default: 0 },

    // Cashfree custom order ID
    customOrderId: {
      type: String,
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

    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon"
    },
    discountAmount: {
      type: Number,
      default: 0
    },

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

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ customOrderId: 1 });

export default mongoose.model("Order", orderSchema);
