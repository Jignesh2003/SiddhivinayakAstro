import express from "express"
import { verifyPayment } from "../controllers/orderController"
import authMiddleware from "../middlewares/authMiddleware"
import { createCashfreeOrder } from "../controllers/cashFreeController"

const router = express.Router()

router.post("/verify-payment", authMiddleware, verifyPayment)
router.post("/cashfree/create-order", authMiddleware, createCashfreeOrder);

export default router;