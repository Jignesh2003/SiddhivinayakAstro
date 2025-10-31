import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./useAuthStore";
import useCartStore from "./useCartStore";
import { handleAuthError } from "../utils/ErrorHandlerLogout.jsx";

const useCouponStore = create((set) => ({
    coupons: [],
    appliedCoupon: null,
    loading: false,
    error: "",

    // 🆕 Helper to get item price (variant or legacy)
    getItemPrice: (item) => {
        if (item.variantId && item.variant?.price) {
            return item.variant.price;
        }
        return item.product?.price ?? 0;
    },

    fetchCoupons: async () => {
        const { token } = useAuthStore.getState();
        const cartState = useCartStore.getState();
        const cart = cartState.cart;

        // 🆕 Updated total calculation with variant support
        const total = cart.reduce((sum, item) => {
            const quantity = item.cartQuantity ?? item.quantity ?? 1;
            // Get price from variant or product
            const price = item.variant?.price ?? item.product?.price ?? 0;
            return sum + (quantity * price);
        }, 0);

        set({ loading: true, error: "" });

        try {
            // 🆕 Updated cart items mapping with variant info
            const cartItems = cart.map((item) => {
                const baseItem = {
                    productId: item.product._id,
                    categoryId: item.product.category,
                    quantity: item.cartQuantity ?? item.quantity ?? 1,
                };

                // Include variant-specific details if present
                if (item.variantId && item.variant) {
                    return {
                        ...baseItem,
                        price: item.variant.price,
                        variantId: item.variantId,           // 🆕 Include variant ID
                        variantName: item.variant.variantName, // 🆕 Include variant name
                        gram: item.variant.gram,             // 🆕 Include gram if available
                    };
                }

                // Legacy product
                return {
                    ...baseItem,
                    price: item.product.price,
                    size: item.size,                        // Include size for legacy products
                };
            });

            const res = await axios.get(
                `${import.meta.env.VITE_COUPON_URL}/getCoupon`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        cartValue: total,
                        cartItems: JSON.stringify(cartItems), // 🆕 Send enhanced cart items
                    },
                }
            );

            if (res.data.success && Array.isArray(res.data.coupons)) {
                set({ coupons: res.data.coupons });
                console.log("✅ Coupons fetched:", res.data.coupons);
                console.log("📊 Cart total:", total);
                console.log("🛒 Cart items sent:", cartItems);
            } else {
                set({ error: "Failed to load coupons" });
            }
        } catch (err) {
            console.error("❌ fetchCoupons error:", err);
            handleAuthError(err);
            set({ error: "Failed to fetch coupons" });
        } finally {
            set({ loading: false });
        }
    },

    applyCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
        console.log("✅ Coupon applied:", coupon);
    },

    clearCoupon: () => {
        set({ appliedCoupon: null });
        console.log("🗑️ Coupon cleared");
    },

    // 🆕 Helper method to calculate discount with variants
    calculateDiscount: (cart, coupon) => {
        if (!coupon) return 0;

        const total = cart.reduce((sum, item) => {
            const quantity = item.cartQuantity ?? item.quantity ?? 1;
            const price = item.variant?.price ?? item.product?.price ?? 0;
            return sum + (quantity * price);
        }, 0);

        if (coupon.discountType === "flat") {
            return Math.min(coupon.discount, total);
        } else if (coupon.discountType === "percentage") {
            const discount = (total * coupon.discountValue) / 100;
            return Math.min(discount, coupon.maxDiscount || Infinity);
        }

        return 0;
    },
}));

export default useCouponStore;
