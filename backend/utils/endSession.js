import ChatSession from "../models/chatSession.js";
import Message from "../models/message.js";
import createChatSessionTransaction from "./chatEndedMoneyTransferAstro.js"; // 🚀 Wallet transaction handler

export const endSession = async (sessionId, io) => {
  try {
    const session = await ChatSession.findById(sessionId);

    // Exit early if session already ended or not found
    if (!session || session.status === "ended") {
      console.log(`⚠️ Skipping end — session not found or already ended: ${sessionId}`);
      return;
    }

    // Check if session has messages
    const messageCount = await Message.countDocuments({ chatSessionId: sessionId });
    if (messageCount === 0) {
      console.log(`🟡 Session ${sessionId} has no messages. Skipping end & billing.`);
      return;
    }

    // Calculate duration & charge
    const endTime = new Date();
    const durationMs = endTime - new Date(session.startTime);
    const minutes = Math.max(Math.ceil(durationMs / 60000), 1); // At least 1 minute
    const ratePerMinute = 50; // 💸 Rate (update if needed per astrologer)
    const amountCharged = minutes * ratePerMinute;

    // Update session info in MongoDB
    session.endTime = endTime;
    session.status = "ended";
    session.amountCharged = amountCharged;
    await session.save();

    console.log(`💾 Session ${sessionId} marked ended. Duration: ${minutes} min. Amount: ₹${amountCharged}`);

    // 💰 Trigger wallet transactions using Supabase/PostgreSQL
    try {
      await createChatSessionTransaction({
        _id: session._id,
        userId: session.userId,
        astrologerId: session.astrologerId,
        amountCharged
      });

      console.log(`💳 Wallet transaction processed for session ${sessionId}`);
    } catch (transactionErr) {
      console.error(`❌ Failed to create wallet transaction:`, transactionErr.message);
    }

    // 🔔 Notify involved users and room
    io.to(sessionId).emit("session-ended", { sessionId, amountCharged });
    io.to(session.userId.toString()).emit("session-ended", { sessionId, amountCharged });
    io.to(session.astrologerId.toString()).emit("session-ended", { sessionId, amountCharged });

    console.log(`✅ Session ${sessionId} fully ended and notified.`);

  } catch (err) {
    console.error("❌ Error in endSession:", err.message);
  }
};

export default endSession;
