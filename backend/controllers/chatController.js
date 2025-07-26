// controllers/chatSession.controller.js

import mongoose from "mongoose";
import ChatSession from "../models/chatSession.js";
import Message from "../models/message.js";
import User from "../models/User.js";
import { getUserWalletBalance, deductFromWallet } from "../services/walletServices.js";


// Fetch chat session and messages
export const fetchChat = async (req, res) => {
  const sessionId = req.params.sessionId;

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ success: false, error: "Invalid sessionId format" });
  }

  try {
    const session = await ChatSession.findById(sessionId)
      .populate("userId", "_id firstName")
      .populate("astrologerId", "_id firstName");

    if (!session) {
      return res.status(404).json({ success: false, error: "Chat session not found" });
    }

    const messages = await Message.find({ chatSessionId: sessionId }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, session, messages });
  } catch (err) {
    console.error("💥 Error fetching session messages:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
};


// Create a pending chat request (checks balance, no debit)
export const createChatRequest = async (req, res) => {
  // You should extract userId from the session/JWT, not req.body to avoid spoofing
  const userId = req.user.id;
  const { astrologerId } = req.body;
  if (!userId || !astrologerId) {
    return res.status(400).json({ success: false, message: "Missing required userId or astrologerId" });
  }
  try {
    // 1. Check if active session exists
    const activeSession = await ChatSession.findOne({
      userId,
      astrologerId,
      status: { $in: ["pending", "approved"] },
      endTime: null,
    });

    if (activeSession) {
      return res.status(200).json({
        success: false,
        message: "An active session already exists",
        sessionData: activeSession,
      });
    }
    // 2. Get astrologer rate
    const astrologer = await User.findById(astrologerId);
    if (!astrologer || typeof astrologer.pricePerMinute !== "number") {
      return res.status(400).json({ success: false, message: "Invalid astrologer." });
    }
    // 3. Check wallet
    const balance = await getUserWalletBalance(userId);
    if (balance === null) {
      return res.status(400).json({ success: false, message: "User wallet not found." });
    }
    if (balance < astrologer.pricePerMinute) {
      return res.status(402).json({
        success: false,
        message: "Insufficient balance. Please recharge your wallet to start a chat.",
        minRequired: astrologer.pricePerMinute
      });
    }
    console.log('Creating new session:', { userId, astrologerId });
    // 4. Create new session
    const newSession = new ChatSession({
      userId,
      astrologerId,
      status: "pending",
    });

    await newSession.save();
    console.log('Session saved:', newSession._id);
    res.status(201).json({
      success: true,
      message: "New chat request created successfully",
      session: newSession,
    });
  } catch (err) {
    console.error("❌ Error creating chat request:", err);
    res.status(500).json({ success: false, message: "Failed to create chat request", error: err.message });
  }
};


// List pending requests for astrologer
export const getPendingRequests = async (req, res) => {
  const { astrologerId } = req.params;

  try {
    const requests = await ChatSession.find({
      astrologerId,
      status: "pending",
    }).populate("userId", "name email");

    res.status(200).json({ success: true, requests });
  } catch (err) {
    console.error("Error fetching pending requests:", err);
    res.status(500).json({ success: false, message: "Failed to fetch requests" });
  }
};


// Astrologer responds to chat request (approve OR reject)
export const respondToRequest = async (req, res) => {
  const { sessionId } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.status !== "pending") return res.status(400).json({ success: false, message: "Request already responded" });

    if (status === "approved") {
      // 1. Fetch astrologer & their rate
      const astro = await User.findById(session.astrologerId);
      if (!astro || typeof astro.pricePerMinute !== "number")
        return res.status(400).json({ success: false, message: "Astrologer or rate not found" });

      // 2. Check wallet again
      const balance = await getUserWalletBalance(session.userId);
      if (balance === null)
        return res.status(400).json({ success: false, message: "User wallet not found" });
      if (balance < astro.pricePerMinute)
        return res.status(402).json({ success: false, message: "Insufficient balance. Please recharge!" });

      // 3. Debit advance for first minute (wallet)
      const debitResult = await deductFromWallet({
        userId: session.userId,
        amount: astro.pricePerMinute,
        businessType: 'chat_session_advance',
        chatSessionId: session._id,
        description: `Advance for chat session start (sessionId: ${session._id})`,
        meta: {}
      });
      if (!debitResult.success) {
        return res.status(500).json({ success: false, message: "Wallet deduction failed: " + (debitResult.error || "") });
      }

      // 4. Approve session in Mongo
      const now = new Date();
      session.status = "approved";
      session.startTime = now;
      session.approvedAt = now;
      session.nextDebitAt = new Date(now.getTime() + 60000); // for per-minute billing
      await session.save();

      return res.json({
        success: true,
        message: "Session approved & started",
        session
      });

    } else if (status === "rejected") {
      session.status = "rejected";
      session.endTime = new Date();
      await session.save();
      return res.json({
        success: true,
        message: "Session rejected",
        session
      });
    }
  } catch (err) {
    console.error("❌ Error in respondToRequest:", err);
    res.status(500).json({ success: false, message: "Failed to update request" });
  }
};


// Lightweight endpoint to get session status (for polling, etc)
export const getSessionStatus = async (req, res) => {
  const { sessionId } = req.params;
  const session = await ChatSession.findById(sessionId).select("status");
  if (!session) return res.status(404).json({ success: false, message: "Session not found" });
  return res.json({ success: true, status: session.status });
};


// (User-side) Update chat session status (likely only for "ended")
export const updateSessionStatus = async (req, res) => {
  const { sessionId } = req.params;
  const { status } = req.body;
  if (!["ended"].includes(status)) {
    // Only allow 'ended'. Remove 'approved'/'rejected' so users can't override flows.
    return res.status(400).json({ success: false, message: "Only 'ended' status update allowed." });
  }

  const session = await ChatSession.findByIdAndUpdate(
    sessionId,
    { status, endTime: status === "ended" ? Date.now() : undefined },
    { new: true }
  );
  if (!session) return res.status(404).json({ success: false, message: "Session not found" });
  return res.json({ success: true, session });
};
