import mongoose from "mongoose";

const stockItemSchema = new mongoose.Schema({
  size: {
    type: String,
    trim: true,
    // required: function () {
    //   return this.ownerDocument().sizeType !== "Quantity";
    // },
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0, "Quantity cannot be negative"],
    default: 0,
  },
}, { _id: false });

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String },
    media: { type: String },
  },
  { timestamps: true, _id: true }
);

const productSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  description:    { type: String, required: true },
  price:          { type: Number, required: true, min: 0 },
  category:       { type: String, enum: [/* your categories */], required: true },
  subcategory:    String,
  brand:          String,
  sizeType:       { type: String, enum: ["Ring", "Quantity", "Mukhi", "Gemstone"], default: "Quantity" },
  stock: {
    type: [stockItemSchema],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: "Stock must have at least one entry",
    }
  },
  image:         [{ type: String, required: true }],
  imagePublicId: [{ type: String, required: true }],
  reviews:       [reviewSchema],
}, { timestamps: true });


export default mongoose.models.Product || mongoose.model("Product", productSchema);
