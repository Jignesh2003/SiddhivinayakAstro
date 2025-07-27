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

    // 2. No-messages "free" sessions: end & emit (no billing)
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

    // 3. Calculate rate/duration/billing amount
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
const minutes = session.minutesDebited || 1;
const amountCharged = minutes * ratePerMinute;

session.endTime = endTime;
session.status = "ended";
session.amountCharged = amountCharged;
await session.save();

console.log(`💾 Session ${sessionId} marked ended. Minutes debited: ${minutes}. Rate: ₹${ratePerMinute}. Amount: ₹${amountCharged}`);

    // 5. Attempt wallet transaction (NEVER early return on error)
    let walletError = null;
    try {
      await createChatSessionTransaction({
        _id: session._id,
        userId: session.userId,
        astrologerId: session.astrologerId,
        amountCharged
      });
      console.log(`💳 Wallet transaction processed for session ${sessionId}`);
    } catch (e) {
      walletError = e;
      console.error(`❌ Failed to create wallet transaction:`, e);
      // Don't return/exit: we emit socket event regardless!
    }

    // 6. ALWAYS emit session-ended over socket, with wallet error if any
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
    // Optionally emit to guarantee FE session-end even if DB error occurs here
    /* 
    if (io) {
      io.to(sessionId).emit("session-ended", { sessionId, error: err.message, critical: true });
    }
    */
    return { success: false, message: "Server error in endSession", error: err.message };
  }
};


export default endSession;
