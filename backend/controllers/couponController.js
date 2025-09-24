import Coupon from "../models/coupon.js";
import User from "../models/User.js";
import { validateCouponForUser } from "../utils/couponServices.js";

//not used yet
export const checkCoupon = async (req, res) => {
    try {
        const { code, cartValue, cartItems } = req.body;
        const userId = req.user?.id ?? null; // auth middleware
        const email = req.user?.email ?? req.body.email ?? null;

        const result = await validateCouponForUser({
            code,
            userId,
            email,
            cartValue,
            cartItems,
        });
        if (result.valid === true) {
            console.log({ userId, code, discount: result.discount }, "Coupon validated successfully");
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
            console.warn({ userId, code, reason: result.reason }, "Coupon validation failed");
            return res.json({ success: false, valid: false, reason: result.reason });
        }
    } catch (err) {
        console.error(err, "Error in checkCoupon");
        res.status(500).json({ success: false, message: "server_error" });
    }
};

export const createCoupon = async (req, res) => {
    try {
        // validate body with Joi or express-validator in production
        const userId = req.user.id; // from auth middleware
        const user = await User.findById(userId); // ✅ correct query

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (user.role !== "admin") {
            console.warn({ userId }, "Forbidden attempt to create coupon");
            return res.status(403).json({ message: "Forbidden" });
        }
        const body = req.body;
        const coupon = new Coupon(body);
        await coupon.save();
        res.status(201).json({ success: true, coupon });
    } catch (error) {
        console.error(error, "Error in createCoupon");
        res.status(500).json({ success: false, message: error.message });
    }

}

export const getCoupon = async (req, res) => {
    try {
        const userId = req.user.id;
        const validUser = await User.findById(userId);

        if (!validUser) {
            console.warn({ userId }, "Unauthorized coupon fetch attempt");
            return res.status(401).json({ message: "Unauthorized User!" });
        }

        // Fetch all active coupons
        const coupons = await Coupon.find({ isActive: true }).lean();
        console.log({ userId, count: coupons.length }, "Fetched active coupons");

        const { cartValue, cartItems } = req.query;
        const validatedCoupons = await Promise.all(
            coupons.map(async (coupon) => {
                const validation = await validateCouponForUser({
                    code: coupon.code,
                    userId,
                    cartValue: Number(cartValue) || 0,
                    cartItems: JSON.parse(cartItems || "[]"),
                });

                return {
                    ...coupon,
                    isValid: validation.valid,
                    reason: validation.reason || null,
                    discount: validation.discount || 0,
                };
            })
        );

        // 👇 Filter out coupons where discount is 0
        const filteredCoupons = validatedCoupons.filter(c => c.discount > 0);

        return res.status(200).json({ success: true, coupons: filteredCoupons });
    } catch (error) {
        console.error(error, "Error in getCoupon");
        return res
            .status(500)
            .json({ success: false, message: error.message });
    }
};

