import express from "express";
const router = express.Router();

import { createChatRequest, fetchChat, getPendingRequests, getSessionStatus, respondToRequest, updateSessionStatus } from "../controllers/chatController.js";

router.get("/:sessionId", fetchChat);

router.post("/request",createChatRequest)

router.get("/requests/:astrologerId", getPendingRequests);

router.patch("/:sessionId/respond", respondToRequest);


//user
router.get("/status/:sessionId", getSessionStatus);

// update status
router.patch("/status/:sessionId", updateSessionStatus);

export default router;