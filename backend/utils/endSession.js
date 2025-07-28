import ChatSession from "../models/ChatSession.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import createTransaction from "./chatEndedMoneyTransferAstro.js"; // your payout handler
import PostgresDb from "../config/postgresDb.js";

export const endSession = async (sessionId, io = null) => {
  try {
    console.log(`[endSession] Starting for session ${sessionId}`);

    // 1. Fetch session
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      console.warn(`[endSession] Session ${sessionId} not found`);
      return { success: false, message: "Session not found." };
    }
    if (session.status === "ended") {
      console.log(`[endSession] Session ${sessionId} already ended`);
      return { success: false, message: "Session already ended." };
    }

    // 2. Prepare user & astro IDs
    const userIdStr = session.userId.toString();
    const astroIdStr = session.astrologerId.toString();
    console.log(`[endSession] Session userId: ${userIdStr}, astrologerId: ${astroIdStr}`);

    // 3. Check if astrologer replied
    const astroMsgCount = await Message.countDocuments({
      chatSessionId: sessionId,
      senderId: session.astrologerId,
    });
    console.log(`[endSession] Astrologer message count: ${astroMsgCount}`);

    // 4. Refund path if no astrologer replies
    if (astroMsgCount === 0) {
      console.log(`[endSession] No astrologer reply detected. Processing refund if any.`);
      let refundError = null;
      let refundedAmount = 0;
      let minutesRefunded = 0;

      try {
        const minutes = session.minutesDebited || 0;
        console.log(`[endSession][Refund] minutes debited: ${minutes}`);

        if (minutes > 0) {
          const astrologer = await User.findById(session.astrologerId);
          if (!astrologer || typeof astrologer.pricePerMinute !== "number") {
            throw new Error("Astrologer data missing or rate invalid");
          }
          const rate = astrologer.pricePerMinute;
          refundedAmount = minutes * rate;
          minutesRefunded = minutes;
          console.log(`[endSession][Refund] Calculated refund amount: ₹${refundedAmount}`);

          await PostgresDb.transaction(async (trx) => {
            const wallet = await trx("wallet").where({ user_id: userIdStr }).forUpdate().first();
            console.log(`[endSession][Refund] Fetched wallet for user:`, wallet);
            if (!wallet) throw new Error("Wallet not found for user refund");

            const newBalance = Number(wallet.balance) + refundedAmount;
            console.log(`[endSession][Refund] New wallet balance after refund: ₹${newBalance}`);

            await trx("wallet_transaction").insert({
              wallet_id: wallet.id,
              chat_session_id: session._id.toString(),
              direction: "credit",
              business_type: "chat_session_refund",
              amount: refundedAmount,
              status: "completed",
              from_user_id: null,
              to_user_id: userIdStr,
              description: "Refund: astrologer did not reply (auto refund)",
              balance_after: newBalance,
              meta: JSON.stringify({
                refundedAmount,
                minutesRefunded,
                reason: "astrologer_no_reply_refund",
                sessionId,
                auto: true,
              }),
              created_at: trx.fn.now(),
            });

            await trx("wallet")
              .where({ id: wallet.id })
              .update({ balance: newBalance, updated_at: trx.fn.now() });
            console.log(`[endSession][Refund] Wallet updated successfully`);
          });

          console.log(`[endSession][Refund] Refund successful for user ₹${refundedAmount}`);
        } else {
          console.log(`[endSession][Refund] No minutes debited; no refund processed`);
        }
      } catch (error) {
        refundError = error;
        console.error(`[endSession][Refund][Error]`, refundError);
      }

      // Mark session ended
      session.status = "ended";
      session.endTime = new Date();
      await session.save();
      console.log(`[endSession][Refund] Session marked ended.`);

      // Emit event with refund info
      if (io) {
        const payload = {
          sessionId,
          amountCharged: 0,
          refundedAmount,
          minutesRefunded,
          walletError: refundError ? refundError.message : null,
          reason: "astrologer_no_reply_refund",
        };
        io.to(sessionId).emit("session-ended", payload);
        io.to(userIdStr).emit("session-ended", payload);
        io.to(astroIdStr).emit("session-ended", payload);
        console.log(`[endSession][Refund] Socket event emitted with refund info`);
      }

      return {
        success: false,
        message: "Session ended, user refunded due to no astrologer reply.",
        refundedAmount,
        minutesRefunded,
        refundError: refundError ? refundError.message : null,
      };
    }

    // 5. Astrologer replied; normal billing and payout
    const astrologer = await User.findById(session.astrologerId);
    if (!astrologer || typeof astrologer.pricePerMinute !== "number") {
      console.error(`[endSession] Astrologer data missing or rate invalid`);
      session.status = "ended";
      session.endTime = new Date();
      await session.save();
      if (io) {
        const payload = {
          sessionId,
          amountCharged: 0,
          walletError: "Astrologer data/rate missing",
          reason: "metadata_missing",
        };
        io.to(sessionId).emit("session-ended", payload);
        io.to(userIdStr).emit("session-ended", payload);
        io.to(astroIdStr).emit("session-ended", payload);
      }
      return {
        success: false,
        message: "Astrologer rate or info missing.",
      };
    }

    const rate = astrologer.pricePerMinute;
    const endTime = new Date();
    const minutes = session.minutesDebited || 1;
    const amountCharged = minutes * rate;

    session.status = "ended";
    session.endTime = endTime;
    session.amountCharged = amountCharged;
    await session.save();
    console.log(
      `[endSession] Session ended normally. Minutes: ${minutes}, Rate: ₹${rate}, Charge: ₹${amountCharged}`
    );

    // Payout to astrologer
    let walletError = null;
    try {
      await createTransaction({
        _id: session._id,
        userId: session.userId,
        astrologerId: session.astrologerId,
        amountCharged,
        minutes,
        rate,
      });
      console.log(`[endSession] Astrologer payout success.`);
    } catch (error) {
      walletError = error;
      console.error(`[endSession] Astrologer payout error:`, error);
    }

    // Emit event with billing info
    if (io) {
      const payload = {
        sessionId,
        amountCharged,
        minutes,
        walletError: walletError ? walletError.message : null,
      };
      io.to(sessionId).emit("session-ended", payload);
      io.to(userIdStr).emit("session-ended", payload);
      io.to(astroIdStr).emit("session-ended", payload);
      console.log(`[endSession] Socket event emitted with payout info`);
    }

    return {
      success: !walletError,
      message: walletError ? "Partial success: payout error" : "Session ended and payout successful",
      amountCharged,
      minutes,
      walletError: walletError ? walletError.message : null,
    };
  } catch (error) {
    console.error(`[endSession] Fatal error:`, error);
    return {
      success: false,
      message: "Critical server error during session end",
      error: error.message,
    };
  }
};

export default endSession;
