import Coupon from "../models/coupon.js";
import CouponRedemption from "../models/couponRedemption.js";
import Order from "../models/Order.js";

// Utility to calculate discount
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

        // 1️⃣ Lookup coupon
        console.log("1");

        const coupon = await Coupon.findOne({ code: normalized });
        if (!coupon) return { valid: false, reason: "not_found" };
        if (!coupon.isActive) return { valid: false, reason: "inactive" };
        if (coupon.startDate && coupon.startDate > now) return { valid: false, reason: "not_started" };
        if (coupon.endDate && coupon.endDate < now) {
            coupon.isActive = false;
            await coupon.save()
            return { valid: false, reason: "expired" }
        };

        // 2️⃣ Minimum cart value
        console.log("2");

        if (coupon.minCartValue && cartValue < coupon.minCartValue) {
            return { valid: false, reason: "min_cart_not_met", minCartValue: coupon.minCartValue };
        }

        // 3️⃣ Product applicability
        console.log("3");
        if (coupon.applicableProducts?.length) {
            const cartProductIds = cartItems.map(it => String(it.productId));
            const allowedProducts = coupon.applicableProducts.map(id => String(id));
            const hasMatch = cartProductIds.some(pid => allowedProducts.includes(pid));
            if (!hasMatch) return { valid: false, reason: "product_not_applicable" };
        }

        // 4️⃣ Excluded products
        console.log("4");

        if (coupon.excludedProducts?.length) {
            const cartProductIds = cartItems.map(it => String(it.productId));
            const excluded = coupon.excludedProducts.map(id => String(id));
            const hasExcluded = cartProductIds.some(pid => excluded.includes(pid));
            if (hasExcluded) return { valid: false, reason: "product_excluded" };
        }

        // 5️⃣ Applicable categories
        console.log("5");

        if (coupon.applicableCategories?.length) {
            const cartCategoryIds = cartItems.map(it => String(it.categoryId));
            const allowedCategories = coupon.applicableCategories.map(id => String(id));
            const hasCategoryMatch = cartCategoryIds.some(cid => allowedCategories.includes(cid));
            if (!hasCategoryMatch) return { valid: false, reason: "category_not_applicable" };
        }

        // 6️⃣ Restricted users
        console.log("6");

        if (coupon.restrictedToUsers?.length && userId) {
            const allowedUsers = coupon.restrictedToUsers.map(id => String(id));
            if (!allowedUsers.includes(String(userId))) return { valid: false, reason: "not_eligible_user" };
        }

        // 7️⃣ New users only (check after eligibility)
        console.log("7");

        if (coupon.newUsersOnly === "new_user" && userId) {
            const prevOrders = await Order.countDocuments({
                user: userId,
                paymentStatus: "Paid", // Only successful orders count
            });
            if (prevOrders > 0) return { valid: false, reason: "not_a_new_user" };
        }

        // 8️⃣ Global usage limit
        console.log("8");

        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
            return { valid: false, reason: "usage_limit_reached" };
        }

        // 9️⃣ Per-user usage limit
        console.log("9");

        // 9️⃣ Per-user usage limit
        // 9️⃣ Per-user usage limit
        if (userId || email) {
            const filter = { couponId: coupon._id };
            if (userId) filter.userId = userId;
            else filter.email = email;

            const usedCount = await CouponRedemption.countDocuments(filter);

            if (coupon.perUserLimit !== null && usedCount >= coupon.perUserLimit) {
                return { valid: false, reason: "per_user_limit_reached" };
            }
        }


        console.log("10");

        // 10️⃣ Non-combinable check (handle at checkout if multiple coupons applied)
        if (!coupon.combinable) {
            // You can store "already applied coupons" in session or cart
        }

        // 11️⃣ Calculate discount
        const discount = calculateDiscount(coupon, cartValue);
        if (discount <= 0) return { valid: false, reason: "no_discount" };
        console.log("Sucessfully validated coupon");

        return { valid: true, discount, coupon, };
    } catch (err) {
        console.error(err, "validateCouponForUser error");
        return { valid: false, reason: "internal_error" };
    }
}
