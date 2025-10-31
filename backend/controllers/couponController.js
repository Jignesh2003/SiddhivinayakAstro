import Coupon from "../models/coupon.js";
import User from "../models/User.js";
import { validateCouponForUser } from "../utils/couponServices.js";

export const checkCoupon = async (req, res) => {
    try {
        const { code, cartValue, cartItems } = req.body;
        const userId = req.user?.id ?? null;
        const email = req.user?.email ?? req.body.email ?? null;

        const result = await validateCouponForUser({
            code,
            userId,
            email,
            cartValue,
            cartItems,
        });

        if (result.valid === true) {
            return res.json({
                success: true,
                valid: true,
                discount: result.discount,
                newTotal: Number((cartValue - result.discount).toFixed(2)),
                couponId: result.coupon._id,
                coupon: {
                    code: result.coupon.code,
                    description: result.coupon.description,
                },
            });
        } else {
            return res.json({ success: false, valid: false, reason: result.reason });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "server_error" });
    }
};

export const createCoupon = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const coupon = new Coupon({ ...req.body, createdBy: userId });
        await coupon.save();

        res.status(201).json({ success: true, coupon });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCoupon = async (req, res) => {
    try {
        const userId = req.user.id;
        const validUser = await User.findById(userId);

        if (!validUser) {
            return res.status(401).json({ message: "Unauthorized User!" });
        }

        const coupons = await Coupon.find({ isActive: true }).lean();
        const { cartValue, cartItems } = req.query;

        // 🆕 Parse cartItems safely
        let parsedItems = [];
        try {
            parsedItems = cartItems ? JSON.parse(cartItems) : [];
        } catch {
            parsedItems = [];
        }

        const validatedCoupons = await Promise.all(
            coupons.map(async (coupon) => {
                const validation = await validateCouponForUser({
                    code: coupon.code,
                    userId,
                    cartValue: Number(cartValue) || 0,
                    cartItems: parsedItems, // 🆕 Pass parsed items with variants
                });

                return {
                    ...coupon,
                    isValid: validation.valid,
                    reason: validation.reason || null,
                    discount: validation.discount || 0,
                };
            })
        );

        const filteredCoupons = validatedCoupons.filter((c) => c.discount > 0);

        return res.status(200).json({ success: true, coupons: filteredCoupons });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
