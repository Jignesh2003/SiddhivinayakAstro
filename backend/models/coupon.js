// models/Coupon.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const CouponSchema = new Schema(
    {
        code: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        description: { type: String },

        // Coupon type: new_user, product_specific, category_specific, cart_value, etc.
        type: {
            type: String,
            enum: ["general", "new_user", "product_specific", "category_specific", "cart_value"],
            default: "general",
        },

        // Discount info
        discountType: { type: String, enum: ["flat", "percentage"], required: true },
        discountValue: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        maxDiscount: { type: Number, default: null }, // cap for percentage discount

        // Cart requirements
        minCartValue: { type: Number, default: 0 },
        maxCartValue: { type: Number, default: null }, // optional max cart

        // Validity
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date, default: null },
        isActive: { type: Boolean, default: true },

        // Usage limits
        usageLimit: { type: Number, default: null }, // global limit
        usageCount: { type: Number, default: 0 },// how many used till now global
        perUserLimit: { type: Number, default: null },
        redeemedCountPerUser: [
            {
                userId: { type: Schema.Types.ObjectId, ref: "User" },
                count: { type: Number, default: 0 },
            },
        ],

        // Applicability rules
        applicableProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
        excludedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
        applicableCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }], // changed to Category
        restrictedToUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        newUsersOnly: { type: Boolean, default: false },

        combinable: { type: Boolean, default: false }, // can combine with other coupons?

        // Extra metadata for admin / tracking
        metadata: { type: Schema.Types.Mixed },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

// Partial index to speed up lookup of active coupons by code
CouponSchema.index(
    { code: 1 },
    { unique: true, partialFilterExpression: { isActive: true } }
);

// Index for quick lookup of coupons by type or new user
CouponSchema.index({ type: 1 });
CouponSchema.index({ newUsersOnly: 1 });

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);


// Set perUserLimit = 1 on WELCOME100.

// For normal coupons, set perUserLimit = null(or > 1).