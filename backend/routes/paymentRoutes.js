import express from "express"
import authMiddleware from "../middlewares/authMiddleware.js"
import { createCashfreeOrder, getOrderStatus} from "../controllers/cashFreeController.js"

const router = express.Router()

router.post("/cashfree/create-order", authMiddleware, createCashfreeOrder);
router.get("/cashfree/check-status",authMiddleware, getOrderStatus)

export default router;