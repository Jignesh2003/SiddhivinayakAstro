import mongoose from "mongoose";
const { Schema } = mongoose;

const CouponRedemptionSchema = new Schema(
    {
        couponId: {
            type: Schema.Types.ObjectId,
            ref: "Coupon",
            required: true,
            index: true,
        },
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true, default: null },
        email: { type: String, index: true },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },

        discountGiven: { type: Number, required: true },
        cartValue: { type: Number, required: true },

        // 🆕 Track which items coupon was applied to
        appliedItems: [
            {
                productId: Schema.Types.ObjectId,
                variantId: Schema.Types.ObjectId, // 🆕
                quantity: Number,
                pricePerUnit: Number,
            },
        ],

        redeemedAt: { type: Date, default: Date.now },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

CouponRedemptionSchema.index({ couponId: 1, userId: 1 });
CouponRedemptionSchema.index({ couponId: 1, email: 1 });

export default mongoose.models.CouponRedemption ||
    mongoose.model("CouponRedemption", CouponRedemptionSchema);
