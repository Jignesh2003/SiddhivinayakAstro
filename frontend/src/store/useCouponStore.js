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

    fetchCoupons: async () => {
        const { token } = useAuthStore.getState();
        const cartState = useCartStore.getState(); // latest cart
        const cart = cartState.cart;
        const total = cart.reduce((sum, item) => sum + (item.cartQuantity ?? item.quantity ?? 1) * (item.product.price ?? 0), 0);
        set({ loading: true, error: "" });

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_COUPON_URL}/getCoupon`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        cartValue: total,
                        cartItems: JSON.stringify(
                            cart.map((item) => ({
                                productId: item.product._id,
                                categoryId: item.product.category, // backend expects categoryId
                                quantity: item.cartQuantity ?? item.quantity ?? 1,
                                price: item.product.price,
                            }))
                        ),
                    },

                }
            );
            

            if (res.data.success && Array.isArray(res.data.coupons)) {
                set({ coupons: res.data.coupons });
                console.log("✅ Coupons fetched:", res.data.coupons);
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
    },

    clearCoupon: () => {
        set({ appliedCoupon: null });
    },
}));

export default useCouponStore;
