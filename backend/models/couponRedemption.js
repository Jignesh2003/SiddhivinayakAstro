// models/CouponRedemption.js
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
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true }, // null for guest (store email instead)
        email: { type: String, index: true },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },

        // snapshot of the discount and cart at redemption time
        discountGiven: { type: Number, required: true },
        cartValue: { type: Number, required: true },

        redeemedAt: { type: Date, default: Date.now },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

// Useful compound index for counting per-user redemptions quickly
CouponRedemptionSchema.index({ couponId: 1, userId: 1 });
CouponRedemptionSchema.index({ couponId: 1, email: 1 });

export default mongoose.models.CouponRedemption ||
    mongoose.model("CouponRedemption", CouponRedemptionSchema);
