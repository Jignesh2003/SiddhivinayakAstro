import express from "express";
const router = express.Router();

import { createChatRequest, fetchChat, getPendingRequests, getSessionStatus, respondToRequest, updateSessionStatus } from "../controllers/chatController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

router.get("/:sessionId", fetchChat);

router.post("/request",authMiddleware, createChatRequest)

router.get("/requests/:astrologerId",authMiddleware, getPendingRequests);

router.patch("/:sessionId/respond",authMiddleware, respondToRequest);


//user
router.get("/status/:sessionId",authMiddleware, getSessionStatus);

// update status
router.patch("/status/:sessionId",authMiddleware, updateSessionStatus);

export default router;