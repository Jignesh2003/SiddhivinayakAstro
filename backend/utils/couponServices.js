import Coupon from "../models/coupon.js";
import CouponRedemption from "../models/couponRedemption.js";
import Order from "../models/Order.js";

export function calculateDiscount(coupon, cartValue) {
    if (coupon.discountType === "flat") {
        return Math.min(coupon.discountValue, cartValue);
    }
    if (coupon.discountType === "percentage") {
        let discount = (cartValue * coupon.discountValue) / 100;
        if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
        }
        return discount;
    }
    return 0;
}

export async function validateCouponForUser({
    code,
    userId = null,
    email = null,
    cartValue,
    cartItems = [],
}) {
    try {
        const now = new Date();
        const normalized = code?.trim().toUpperCase();
        if (!normalized) return { valid: false, reason: "no_code" };

        // Lookup coupon
        const coupon = await Coupon.findOne({ code: normalized });
        if (!coupon) return { valid: false, reason: "not_found" };
        if (!coupon.isActive) return { valid: false, reason: "inactive" };
        if (coupon.startDate && coupon.startDate > now) return { valid: false, reason: "not_started" };
        if (coupon.endDate && coupon.endDate < now) {
            coupon.isActive = false;
            await coupon.save();
            return { valid: false, reason: "expired" };
        }

        // Minimum cart value
        if (coupon.minCartValue && cartValue < coupon.minCartValue) {
            return { valid: false, reason: "min_cart_not_met" };
        }

        // Product applicability
        if (coupon.applicableProducts?.length) {
            const cartProductIds = cartItems.map((it) => String(it.productId));
            const allowedProducts = coupon.applicableProducts.map((id) => String(id));
            const hasMatch = cartProductIds.some((pid) => allowedProducts.includes(pid));
            if (!hasMatch) return { valid: false, reason: "product_not_applicable" };
        }

        // 🆕 Variant applicability
        if (coupon.applicableVariants?.length) {
            const cartVariantIds = cartItems
                .filter((it) => it.variantId)
                .map((it) => String(it.variantId));
            const allowedVariants = coupon.applicableVariants.map((id) => String(id));
            const hasVariantMatch = cartVariantIds.some((vid) => allowedVariants.includes(vid));
            if (cartVariantIds.length > 0 && !hasVariantMatch) {
                return { valid: false, reason: "variant_not_applicable" };
            }
        }

        // Excluded products
        if (coupon.excludedProducts?.length) {
            const cartProductIds = cartItems.map((it) => String(it.productId));
            const excluded = coupon.excludedProducts.map((id) => String(id));
            const hasExcluded = cartProductIds.some((pid) => excluded.includes(pid));
            if (hasExcluded) return { valid: false, reason: "product_excluded" };
        }

        // Applicable categories
        if (coupon.applicableCategories?.length) {
            const cartCategoryIds = cartItems.map((it) => String(it.categoryId));
            const allowedCategories = coupon.applicableCategories.map((id) => String(id));
            const hasCategoryMatch = cartCategoryIds.some((cid) =>
                allowedCategories.includes(cid)
            );
            if (!hasCategoryMatch) return { valid: false, reason: "category_not_applicable" };
        }

        // Restricted users
        if (coupon.restrictedToUsers?.length && userId) {
            const allowedUsers = coupon.restrictedToUsers.map((id) => String(id));
            if (!allowedUsers.includes(String(userId))) {
                return { valid: false, reason: "not_eligible_user" };
            }
        }

        // New users only
        if (coupon.newUsersOnly && userId) {
            const prevOrders = await Order.countDocuments({
                user: userId,
                paymentStatus: "Paid",
            });
            if (prevOrders > 0) return { valid: false, reason: "not_a_new_user" };
        }

        // Global usage limit
        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
            return { valid: false, reason: "usage_limit_reached" };
        }

        // Per-user usage limit
        if (userId || email) {
            const filter = { couponId: coupon._id };
            if (userId) filter.userId = userId;
            else filter.email = email;

            const usedCount = await CouponRedemption.countDocuments(filter);

            if (coupon.perUserLimit !== null && usedCount >= coupon.perUserLimit) {
                return { valid: false, reason: "per_user_limit_reached" };
            }
        }

        // Calculate discount
        const discount = calculateDiscount(coupon, cartValue);
        if (discount <= 0) return { valid: false, reason: "no_discount" };

        return { valid: true, discount, coupon };
    } catch (err) {
        console.error("validateCouponForUser error:", err);
        return { valid: false, reason: "internal_error" };
    }
}
