import ChatSession from "../models/chatSession.js";
import Message from "../models/message.js";
import User from "../models/User.js";
import createChatSessionTransaction from "./chatEndedMoneyTransferAstro.js"; // PostgreSQL atomic wallet handler

/**
 * Ends a chat session:
 * - Calculates total minutes/charges
 * - Updates Mongo session as ended
 * - Processes wallet settlement (user pays, platform fees/commission, astrologer net)
 * - Emits socket notification (optional)
 */
export const endSession = async (sessionId, io = null) => {
  try {
    // 1. Fetch session
    const session = await ChatSession.findById(sessionId);
    if (!session || session.status === "ended") {
      console.log(`⚠️ Skipping end — session not found or already ended: ${sessionId}`);
      return { success: false, message: "Session not found or already ended." };
    }

    // 2. Make sure session actually has messages (no free empty sessions)
    const messageCount = await Message.countDocuments({ chatSessionId: sessionId });
    if (messageCount === 0) {
      console.log(`🟡 Session ${sessionId} has no messages. Skipping end & billing.`);
      // Optionally mark ended without billing
      session.status = "ended";
      session.endTime = new Date();
      await session.save();
      return { success: false, message: "No messages, session ended without billing." };
    }

    // 3. Fetch astrologer and chat rate
    const astrologer = await User.findById(session.astrologerId);
    if (!astrologer || typeof astrologer.pricePerMinute !== "number") {
      console.error(`❌ Astrologer not found or pricePerMinute missing for ${session.astrologerId}`);
      session.status = "ended";
      session.endTime = new Date();
      await session.save();
      return { success: false, message: "Astrologer/rate missing." };
    }
    const ratePerMinute = astrologer.pricePerMinute;

    // 4. Calculate charge duration
    const endTime = new Date();
    const durationMs = endTime - new Date(session.startTime);
    const minutes = Math.max(Math.ceil(durationMs / 60000), 1); // Always round up to nearest min
    const amountCharged = minutes * ratePerMinute;

    // 5. Update Mongo session
    session.endTime = endTime;
    session.status = "ended";
    session.amountCharged = amountCharged;
    await session.save();

    console.log(`💾 Session ${sessionId} marked ended. Duration: ${minutes} min. Astrologer rate: ₹${ratePerMinute}/min. Amount: ₹${amountCharged}`);

    // 6. Trigger wallet settlement (atomic in Postgres)
    try {
      // This function should internally handle:
      // - User debit (amountCharged)
      // - Astrologer credit (net after fees)
      // - Wallet audit logs
      // - Platform fee collection
      await createChatSessionTransaction({
        _id: session._id,
        userId: session.userId,
        astrologerId: session.astrologerId,
        amountCharged // always the full amount, commission/net handled in wallet handler
      });
      console.log(`💳 Wallet transaction processed for session ${sessionId}`);
    } catch (transactionErr) {
      console.error(`❌ Failed to create wallet transaction:`, transactionErr);
      // Optionally emit notification of wallet failure here
      return { success: false, message: "Session ended, but wallet settlement failed.", error: transactionErr.message };
    }

    // 7. Notify both users and room (if io/socket provided)
    if (io) {
      io.to(sessionId).emit("session-ended", { sessionId, amountCharged });
      io.to(session.userId.toString()).emit("session-ended", { sessionId, amountCharged });
      io.to(session.astrologerId.toString()).emit("session-ended", { sessionId, amountCharged });
    }

    console.log(`✅ Session ${sessionId} fully ended and notified.`);
    return { success: true, sessionId, amountCharged, minutes };

  } catch (err) {
    console.error("❌ Error in endSession:", err);
    return { success: false, message: "Unexpected server error in endSession", error: err.message };
  }
};

export default endSession;
