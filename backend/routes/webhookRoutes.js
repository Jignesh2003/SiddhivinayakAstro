// routes/webhookRoutes.js
import express from "express"
import { verifyPayment } from "../controllers/webhookController.js";

const router = express.Router();

router.post("/verify-payment", express.raw({ type: "application/json" }), verifyPayment);

export default router;


