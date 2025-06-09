import ChatSession from "../models/chatSession.js";
import Message from "../models/message.js";

export const endSession = async (sessionId, io) => {
  try {
    const session = await ChatSession.findById(sessionId);
    if (!session || session.status === "ended") return;

    const messageCount = await Message.countDocuments({ chatSessionId: sessionId });
    if (messageCount === 0) {
      console.log(`🟡 Session ${sessionId} has no messages. Skipping end.`);
      return;
    }

    const endTime = new Date();
    const durationMs = endTime - session.startTime;
    const minutes = Math.ceil(durationMs / 60000);
    const ratePerMinute = 50;
    const amountCharged = minutes * ratePerMinute;

    session.endTime = endTime;
    session.status = "ended";
    session.amountCharged = amountCharged;
    await session.save();

    // Emit to both individual users and the session room
    io.to(sessionId).emit("session-ended", { sessionId });
    io.to(session.userId.toString()).emit("session-ended", { sessionId });
    io.to(session.astrologerId.toString()).emit("session-ended", { sessionId });

    console.log(`✅ Session ${sessionId} ended. Charged ₹${amountCharged}`);
  } catch (err) {
    console.error("❌ Error ending session:", err.message);
  }
};
