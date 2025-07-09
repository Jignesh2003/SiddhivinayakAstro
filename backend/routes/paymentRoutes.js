import express from "express"
import { verifyPayment } from "../controllers/orderController.js"
import authMiddleware from "../middlewares/authMiddleware.js"
import { createCashfreeOrder } from "../controllers/cashFreeController.js"

const router = express.Router()

router.post("/verify-payment", authMiddleware, verifyPayment)
router.post("/cashfree/create-order", authMiddleware, createCashfreeOrder);

export default router;