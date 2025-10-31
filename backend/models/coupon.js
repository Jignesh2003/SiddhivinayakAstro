import mongoose from "mongoose";
const { Schema } = mongoose;

const CouponSchema = new Schema(
    {
        code: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            unique: true,
        },
        description: { type: String },

        type: {
            type: String,
            enum: [
                "general",
                "new_user",
                "product_specific",
                "category_specific",
                "cart_value",
                "variant_specific", // 🆕
            ],
            default: "general",
        },

        discountType: { type: String, enum: ["flat", "percentage"], required: true },
        discountValue: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        maxDiscount: { type: Number, default: null },

        minCartValue: { type: Number, default: 0 },
        maxCartValue: { type: Number, default: null },

        startDate: { type: Date, default: Date.now },
        endDate: { type: Date, default: null },
        isActive: { type: Boolean, default: true },

        usageLimit: { type: Number, default: null },
        usageCount: { type: Number, default: 0 },
        perUserLimit: { type: Number, default: null },
        redeemedCountPerUser: [
            {
                userId: { type: Schema.Types.ObjectId, ref: "User" },
                count: { type: Number, default: 0 },
            },
        ],

        applicableProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
        excludedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
        applicableVariants: [{ type: Schema.Types.ObjectId }], // 🆕
        applicableCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
        restrictedToUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        newUsersOnly: { type: Boolean, default: false },

        combinable: { type: Boolean, default: false },

        metadata: { type: Schema.Types.Mixed },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

CouponSchema.index({ type: 1 });
CouponSchema.index({ isActive: 1 });

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
