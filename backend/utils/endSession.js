import ChatSession from "../models/chatSession.js";
import Message from "../models/message.js";
import User from "../models/User.js";
import createChatSessionTransaction from "./chatEndedMoneyTransferAstro.js";
import PostgresDb from '../config/postgresDb.js';

/**
 * Ends a chat session:
 * - Calculates billable minutes
 * - Bills only if astrologer replied at least once; else refunds user
 * - Payouts astrologer net from platform (never user double-debit)
 * - Updates Mongo session as ended
 * - Emits socket notification (session-ended) for all outcomes
 */
export const endSession = async (sessionId, io = null) => {
  try {
    // 1. Fetch session
    const session = await ChatSession.findById(sessionId);
    if (!session || session.status === "ended") {
      console.log(`⚠️ Skipping end — session not found or already ended: ${sessionId}`);
      return { success: false, message: "Session not found or already ended." };
    }

    const userIdStr = session.userId.toString();
    const astroIdStr = session.astrologerId.toString();

    // 2. Did the astrologer ever reply?
    const astroMsgCount = await Message.countDocuments({
      chatSessionId: sessionId,
      senderId: session.astrologerId
    });

    // If astrologer never replied, refund user and end (NO payout to astro)
    if (astroMsgCount === 0) {
      let refundError = null;
      let refundedAmount = 0;
      let minutesRefunded = 0;
      try {
        const minutes = session.minutesDebited || 0;
        if (minutes > 0) {
          const astrologer = await User.findById(session.astrologerId);
          if (!astrologer || typeof astrologer.pricePerMinute !== "number") {
            throw new Error("Astrologer not found or pricePerMinute missing.");
          }
          const ratePerMinute = astrologer.pricePerMinute;
          refundedAmount = minutes * ratePerMinute;
          minutesRefunded = minutes;

          await PostgresDb.transaction(async trx => {
            const userWallet = await trx('wallet').where({ user_id: userIdStr }).forUpdate().first();
            if (!userWallet) throw new Error("User wallet not found for refund");
            const userBalanceAfter = Number(userWallet.balance) + refundedAmount;

            await trx('wallet_transaction').insert({
              wallet_id: userWallet.id,
              chat_session_id: session._id.toString(),
              direction: 'credit',
              business_type: 'chat_session_refund',
              amount: refundedAmount,
              status: 'completed',
              from_user_id: null,
              to_user_id: userIdStr,
              description: 'Refund: astrologer never replied (auto unavailability refund)',
              balance_after: userBalanceAfter,
              meta: JSON.stringify({
                refundedAmount,
                minutesRefunded,
                reason: "astrologer-no-reply/auto_refund",
                sessionId,
                auto: true
              }),
              created_at: trx.fn.now()
            });

            await trx('wallet')
              .where({ id: userWallet.id })
              .update({ balance: userBalanceAfter, updated_at: trx.fn.now() });
          });

          console.log(`💸 Refunded ₹${refundedAmount} to user ${userIdStr} (updated wallet) for session ${sessionId}, astrologer never replied.`);
        }
      } catch (refundErr) {
        refundError = refundErr;
        console.error(`❌ Failed to process user refund for astro-no-reply session:`, refundErr);
      }

      // End the session in MongoDB
      session.status = "ended";
      session.endTime = new Date();
      await session.save();

      if (io) {
        const eventPayload = {
          sessionId,
          amountCharged: 0,
          refundedAmount,
          minutesRefunded,
          walletError: refundError?.message || null,
          reason: "astro-no-reply-refunded"
        };
        io.to(sessionId).emit("session-ended", eventPayload);
        io.to(userIdStr).emit("session-ended", eventPayload);
        io.to(astroIdStr).emit("session-ended", eventPayload);
      }
      return {
        success: false,
        message: "Astrologer never replied, session ended, user refunded.",
        refundedAmount,
        minutesRefunded,
        refundError: refundError?.message || null
      };
    }

    // Astro replied at least once: payout as usual
    const astrologer = await User.findById(session.astrologerId);
    if (!astrologer || typeof astrologer.pricePerMinute !== "number") {
      console.error(`❌ Astrologer not found or pricePerMinute missing for ${session.astrologerId}`);
      session.status = "ended";
      session.endTime = new Date();
      await session.save();
      if (io) {
        const eventPayload = { sessionId, amountCharged: 0, walletError: "No astro/rate", reason: "metadata-missing" };
        io.to(sessionId).emit("session-ended", eventPayload);
        io.to(userIdStr).emit("session-ended", eventPayload);
        io.to(astroIdStr).emit("session-ended", eventPayload);
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

    console.log(`💾 Session ${sessionId} ended (astro replied). Minutes: ${minutes}, Rate: ₹${ratePerMinute}, Amount: ₹${amountCharged}`);

    // Astrologer payout
    let walletError = null;
    try {
      await createChatSessionTransaction({
        _id: session._id,
        userId: session.userId,
        astrologerId: session.astrologerId,
        amountCharged,
        minutes,
        ratePerMinute
      });
      console.log(`💳 Astrologer payout processed for session ${sessionId}`);
    } catch (error) {
      walletError = error;
      console.error(`❌ Astrologer payout error:`, error);
    }

    if (io) {
      const eventPayload = {
        sessionId, amountCharged, minutes, walletError: walletError?.message || null
      };
      io.to(sessionId).emit("session-ended", eventPayload);
      io.to(userIdStr).emit("session-ended", eventPayload);
      io.to(astroIdStr).emit("session-ended", eventPayload);
    }
    console.log(`✅ Session ${sessionId} fully ended and notified.${walletError ? " (Wallet error included in event)" : ""}`);

    return {
      success: true, sessionId, amountCharged, minutes,
      walletError: walletError?.message || null
    };

  } catch (err) {
    console.error("❌ Error in endSession:", err);
    return { success: false, message: "Server error in endSession", error: err.message };
  }
};

export default endSession;
