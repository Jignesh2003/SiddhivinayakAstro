import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
    imagePublicId: { type: String, required: true },// Cloudinary “public_id”
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      media: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

// ✅ Prevent model overwrite in dev (important for .save() to work correctly)
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
