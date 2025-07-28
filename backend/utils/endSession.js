import ChatSession from "../models/chatSession.js";
import Message from "../models/message.js";
import User from "../models/User.js";
import createChatSessionTransaction from "./chatEndedMoneyTransferAstro.js"; // your Postgres handler

/**
 * Ends a chat session:
 * - Calculates total billable minutes (minutesDebited)
 * - Updates Mongo session as ended
 * - Pays astrologer net (from platform, not user wallet—user has ALREADY paid)
 * - Emits socket notification (session-ended)
 */
export const endSession = async (sessionId, io = null) => {
  try {
    // 1. Fetch session
    const session = await ChatSession.findById(sessionId);
    if (!session || session.status === "ended") {
      console.log(`⚠️ Skipping end — session not found or already ended: ${sessionId}`);
      return { success: false, message: "Session not found or already ended." };
    }

    // 2. If there are no messages, end session without billing
    const messageCount = await Message.countDocuments({ chatSessionId: sessionId });
    if (messageCount === 0) {
      session.status = "ended";
      session.endTime = new Date();
      await session.save();
      if (io) {
        const eventPayload = { sessionId, amountCharged: 0, walletError: null, reason: "no-messages" };
        io.to(sessionId).emit("session-ended", eventPayload);
        io.to(session.userId.toString()).emit("session-ended", eventPayload);
        io.to(session.astrologerId.toString()).emit("session-ended", eventPayload);
      }
      return { success: false, message: "No messages, session ended without billing." };
    }

    // 3. Gather billable minutes and settlement info
    const astrologer = await User.findById(session.astrologerId);
    if (!astrologer || typeof astrologer.pricePerMinute !== "number") {
      console.error(`❌ Astrologer not found or pricePerMinute missing for ${session.astrologerId}`);
      session.status = "ended";
      session.endTime = new Date();
      await session.save();
      if (io) {
        const eventPayload = { sessionId, amountCharged: 0, walletError: "No astro/rate", reason: "metadata-missing" };
        io.to(sessionId).emit("session-ended", eventPayload);
        io.to(session.userId.toString()).emit("session-ended", eventPayload);
        io.to(session.astrologerId.toString()).emit("session-ended", eventPayload);
      }
      return { success: false, message: "Astrologer/rate missing." };
    }

    const ratePerMinute = astrologer.pricePerMinute;
    const endTime = new Date();
    const minutes = session.minutesDebited || 1;  // <-- Only what you debited, NOT duration
    const amountCharged = minutes * ratePerMinute;

    session.endTime = endTime;
    session.status = "ended";
    session.amountCharged = amountCharged;
    await session.save();

    console.log(`💾 Session ${sessionId} marked ended. Minutes debited: ${minutes}. Rate: ₹${ratePerMinute}. Amount: ₹${amountCharged}`);

    // 4. Wallet settlement: payout only (NET to astrologer & log fee/gst), do NOT debit user again
    let walletError = null;
    try {
      await createChatSessionTransaction({
        _id: session._id,
        userId: session.userId,
        astrologerId: session.astrologerId,
        amountCharged,
        // Optionally: pass minutes, per-minute rate, etc. if your settlement handler uses them
      });
      console.log(`💳 Astrologer payout processed for session ${sessionId}`);
    } catch (error) {
      walletError = error;
      console.error(`❌ Failed to settle astrologer payout:`, error);
      // Still proceed: never block session-end on payout!
    }

    // 5. Always emit session-ended over socket, even on payout error
    if (io) {
      const eventPayload = { sessionId, amountCharged, minutes, walletError: walletError?.message || null };
      io.to(sessionId).emit("session-ended", eventPayload);
      io.to(session.userId.toString()).emit("session-ended", eventPayload);
      io.to(session.astrologerId.toString()).emit("session-ended", eventPayload);
    }
    console.log(`✅ Session ${sessionId} fully ended and notified.${walletError ? " (Wallet error included in event)" : ""}`);

    return {
      success: true,
      sessionId,
      amountCharged,
      minutes,
      walletError: walletError?.message || null
    };

  } catch (err) {
    console.error("❌ Error in endSession:", err);
    return { success: false, message: "Server error in endSession", error: err.message };
  }
};

export default endSession;
