// routes/coupons.js (express router)
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { checkCoupon, createCoupon, getCoupon } from "../controllers/couponController.js";

const router = express.Router();

router.post("/validate", authMiddleware, checkCoupon); // not used yet

// admin route snippet
router.post("/create", authMiddleware, createCoupon);

router.get("/getCoupon", authMiddleware, getCoupon)//used to show coupon on cart


export default router;