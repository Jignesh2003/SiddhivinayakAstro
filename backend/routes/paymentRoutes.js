import express from "express"
import authMiddleware from "../middlewares/authMiddleware.js"
import { createCashfreeOrder ,verifyPayment} from "../controllers/cashFreeController.js"

const router = express.Router()

router.post("/verify-payment", authMiddleware, verifyPayment)
router.post("/cashfree/create-order", authMiddleware, createCashfreeOrder);

export default router;