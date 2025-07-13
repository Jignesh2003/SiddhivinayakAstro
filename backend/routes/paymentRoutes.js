import express from "express"
import authMiddleware from "../middlewares/authMiddleware.js"
import { checkPaymentStatus, createCashfreeOrder} from "../controllers/cashFreeController.js"

const router = express.Router()

router.post("/cashfree/create-order", authMiddleware, createCashfreeOrder);
router.get("/cashfree/check-status",authMiddleware, checkPaymentStatus)

export default router;