import mongoose from "mongoose";
import ChatSession from "../models/chatSession.js";
import Message from "../models/message.js";

export const fetchChat =  async (req, res) => {
  const sessionId = req.params.sessionId;

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ error: "Invalid sessionId format" });
  }

  try {
    const session = await ChatSession.findById(sessionId)
      .populate("userId", "_id firstName")
      .populate("astrologerId", "_id firstName");

    if (!session) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    // 🔥 Fetch messages directly by chatSessionId
    const messages = await Message.find({ chatSessionId: sessionId }).sort({ createdAt: 1 });

    res.status(200).json({ session, messages });
  } catch (err) {
    console.error("💥 Error fetching session messages:", err.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
}

export const createChatRequest = async (req, res) => {
  const { userId, astrologerId } = req.body;

  try {
    // Check if an active session exists (not ended)
    const activeSession = await ChatSession.findOne({
      userId,
      astrologerId,
      status: { $in: ["pending", "approved"] },
      endTime: null, // Explicit check
    });

    if (activeSession) {
      return res.status(200).json({
        message: "An active session already exists",
        sessionData: activeSession,
      });
    }

    // Always allow new session creation if no active one
    const newSession = new ChatSession({
      userId,
      astrologerId,
      status: "pending",
    });

    await newSession.save();

    res.status(201).json({
      message: "New chat request created successfully",
      session: newSession,
    });
  } catch (err) {
    console.error("❌ Error creating chat request:", err);
    res.status(500).json({ message: "Failed to create chat request" });
  }
};

  

// GET /api/chat/requests/:astrologerId
export const getPendingRequests = async (req, res) => {
  const { astrologerId } = req.params;

  try {
    const requests = await ChatSession.find({
      astrologerId,
      status: "pending",
    }).populate("userId", "name email"); // populate relevant user fields

    res.status(200).json({ requests }); // wrapped in a named key
  } catch (err) {
    console.error("Error fetching pending requests:", err);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};


// Body: { status: "approved" | "rejected" }
export const respondToRequest = async (req, res) => {
    const { sessionId } = req.params;
    const { status } = req.body;
  
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
  
    try {
      const session = await ChatSession.findById(sessionId);
  
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
  
      if (session.status !== "pending") {
        return res.status(400).json({ message: "Request already responded" });
      }
  
      session.status = status;
  
      if (status === "approved") {
        session.startTime = new Date();
      } else if (status === "rejected") {
        session.endTime = new Date();
      }
  
      await session.save();
  
      res.json(session);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update request" });
    }
  };
  

 // controllers/chatSession.controller.js

export const getSessionStatus = async (req, res) => {
  const { sessionId } = req.params;
  const session = await ChatSession.findById(sessionId).select("status");
  if (!session) return res.status(404).json({ message: "Session not found" });
  return res.json({ status: session.status });
};

// controllers/chatSession.controller.js

//user side
export const updateSessionStatus = async (req, res) => {
  const { sessionId } = req.params;
  const { status } = req.body;
  if (!["approved", "rejected", "ended"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const session = await ChatSession.findByIdAndUpdate(
    sessionId,
    { status, approvedAt: status === "approved" ? Date.now() : undefined },
    { new: true }
  );
  if (!session) return res.status(404).json({ message: "Session not found" });
  return res.json({ session });
};
