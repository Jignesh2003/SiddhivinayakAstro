import mongoose from "mongoose";
import Counter from "./counter.js"

const stockItemSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String },
    media: { type: String },
  },
  { timestamps: true, _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    description: { type: String },
    tags: [{ type: String }],
    miniDesc: { type: String },
    price: { type: Number, min: 0 },
    category: {
      type: String,
      enum: [
        "Gifts",
        "Gemstones",
        "Necklaces",
        "Rings",
        "Bracelets",
        "Puja samagri",
        "Turtle",
        "Rudraksha",
        "Customized",
      ],
    },
    subcategory: String,
    brand: String,
    sizeType: {
      type: String,
      enum: ["Ring", "Quantity", "Mukhi", "Gemstone"],
      default: "Quantity",
    },
    stock: {
      type: [stockItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Stock must have at least one entry",
      },
    },
    image: [{ type: String }],
    imagePublicId: [{ type: String }],
    reviews: [reviewSchema],
    productNumber: { type: Number, unique: true }, 
  },
  { timestamps: true }
);

// Manual auto-increment pre-save hook
productSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        "productNumber",            // counter document id
        { $inc: { seq: 1 } },       // increment seq by 1
        { new: true, upsert: true } // create counter doc if not exists
      );
      this.productNumber = counter.seq;  // assign incremented value
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
