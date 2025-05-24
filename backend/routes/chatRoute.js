import express from "express";
const router = express.Router();

import { createChatRequest, fetchChat, getPendingRequests, respondToRequest } from "../controllers/chatController.js";

router.get("/:sessionId", fetchChat);

router.post("/request",createChatRequest)

router.get("/requests/:astrologerId", getPendingRequests);

router.patch("/:sessionId/respond", respondToRequest);

export default router;