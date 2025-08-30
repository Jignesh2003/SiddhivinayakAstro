import ChatSession from "../models/chatSession.js";
import Message from "../models/message.js";
import User from "../models/User.js";
import createTransaction from "./chatEndedMoneyTransferAstro.js"; // payout handler
import PostgresDb from "../config/postgresDb.js";

export const endSession = async (sessionId, io = null) => {
  try {
    console.log(
      `========== [endSession] Starting for session ${sessionId} ==========`
    );

    // 1. Atomically end session (only if not already ended)
    const atomicSession = await ChatSession.findOneAndUpdate(
      { _id: sessionId, status: { $ne: "ended" } },
      { $set: { status: "ended", endTime: new Date() } },
      { new: true }
    );

    if (!atomicSession) {
      console.warn(`[endSession] ALREADY ENDED: Session ${sessionId}`);
      return { success: false, message: "Session already ended." };
    }
    const session = atomicSession;
    // Defensive: update amountCharged later after payout/refund branch

    // 2. Prepare user & astro IDs
    const userIdStr = session.userId.toString();
    const astroIdStr = session.astrologerId.toString();
    console.log(
      `[endSession] userId: ${userIdStr}, astrologerId: ${astroIdStr}, minutesDebited: ${session.minutesDebited}`
    );

    // 3. Check if astrologer replied
    const astroMsgCount = await Message.countDocuments({
      chatSessionId: sessionId,
      senderId: session.astrologerId,
    });
    console.log(`[endSession] Astrologer message count: ${astroMsgCount}`);

    // 4. REFUND PATH IF NO ASTRO REPLY
    if (astroMsgCount === 0) {
      console.log(
        `[endSession][REFUND] Astrologer never replied. Processing refund...`
      );
      let refundError = null;
      let refundedAmount = 0;
      let minutesRefunded = 0;

      try {
        // Defensive reload (in case debits changed during race)
        const latestSession = await ChatSession.findById(sessionId);
        const minutes = latestSession.minutesDebited ?? 0;
        console.log(
          `[endSession][REFUND] Fresh minutesDebited from DB:`,
          minutes
        );

        if (minutes > 0) {
          const astrologer = await User.findById(session.astrologerId);
          if (!astrologer || typeof astrologer.pricePerMinute !== "number") {
            throw new Error("[REFUND] Astrologer data/rate missing.");
          }
          const rate = astrologer.pricePerMinute;
          refundedAmount = minutes * rate;
          minutesRefunded = minutes;
          console.log(
            `[endSession][REFUND] Will refund ₹${refundedAmount} for ${minutes} minute(s).`
          );

          await PostgresDb.transaction(async (trx) => {
            // Prevent double wallet payout/refund
            const existingRefund = await trx("wallet_transaction")
              .where({
                chat_session_id: session._id.toString(),
                business_type: "chat_session_refund",
              })
              .first();
            if (existingRefund)
              throw new Error("[REFUND] Refund already processed for session.");

            const wallet = await trx("wallet")
              .where({ user_id: userIdStr })
              .forUpdate()
              .first();
            console.log(
              `[endSession][REFUND] User wallet ${
                wallet ? "found" : "NOT FOUND"
              }:`,
              wallet ? wallet.id : null,
              `(balance: ${wallet ? wallet.balance : "n/a"})`
            );
            if (!wallet) throw new Error("[REFUND] Wallet not found for user.");

            const newBalance = Number(wallet.balance) + refundedAmount;
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
                userIdStr,
                auto: true,
              }),
              created_at: trx.fn.now(),
            });
            await trx("wallet")
              .where({ id: wallet.id })
              .update({ balance: newBalance, updated_at: trx.fn.now() });
            console.log(`[endSession][REFUND] WALLET CREDITED successfully.`);
          });

          console.log(
            `[endSession][REFUND] Refund SUCCESSFUL for user ${userIdStr}, session ${sessionId}, amount ₹${refundedAmount}`
          );
        } else {
          console.warn(
            `[endSession][REFUND] No minutes debited (minutesDebited=0); nothing to refund.`
          );
        }
      } catch (error) {
        refundError = error;
        console.error(
          `[endSession][REFUND][ERROR] during refund for user ${userIdStr}:`,
          error
        );
      }

      // Session status already marked ended by atomic update above

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
        console.log(`[endSession][REFUND] Socket event emitted (refund)`);
      }

      return {
        success: refundError ? false : true,
        message: refundError
          ? `Refund ERROR: ${refundError.message}`
          : "Session ended, user refunded due to no astrologer reply.",
        refundedAmount,
        minutesRefunded,
        refundError: refundError ? refundError.message : null,
      };
    }

    // 5. PAYOUT TO ASTRO PATH
    // Defensive reload for updated session debits
    const latestSession = await ChatSession.findById(sessionId);
    const minutes = latestSession.minutesDebited ?? 1;
    const astrologer = await User.findById(session.astrologerId);
    if (!astrologer || typeof astrologer.pricePerMinute !== "number") {
      console.error(
        `[endSession][PAYOUT] Astrologer not found or rate missing`
      );
      // Status already set to ended by atomic update above
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
    const amountCharged = minutes * rate;

    // Defensive Postgres: prevent double payout with wallet_transaction check
    let walletError = null;
    try {
      await PostgresDb.transaction(async (trx) => {
        const existingPayout = await trx("wallet_transaction")
          .where({
            chat_session_id: session._id.toString(),
            business_type: "chat_session_payout",
          })
          .first();
        if (existingPayout)
          throw new Error("[PAYOUT] Payout already processed for session.");

        // Call domain payout handler (still add check there ideally!)
        await createTransaction({
          _id: session._id,
          userId: session.userId,
          astrologerId: session.astrologerId,
          amountCharged,
          minutes,
          rate,
        });
      });
      console.log(`[endSession][PAYOUT] Astrologer payout SUCCESS`);
    } catch (error) {
      walletError = error;
      console.error(
        `[endSession][PAYOUT][ERROR] Astrologer payout error:`,
        error
      );
    }

    // Update session amountCharged (Mongo)
    session.amountCharged = amountCharged;
    await session.save();
    console.log(
      `[endSession][PAYOUT] Marked session ended. Minutes: ${minutes}, Rate: ₹${rate}, Total Charged: ₹${amountCharged}`
    );

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
      console.log(`[endSession][PAYOUT] Socket event emitted (payout)`);
    }

    return {
      success: !walletError,
      message: walletError
        ? "Partial success: payout error"
        : "Session ended and payout successful",
      amountCharged,
      minutes,
      walletError: walletError ? walletError.message : null,
    };
  } catch (error) {
    console.error(`[endSession][FATAL ERROR]:`, error);
    return {
      success: false,
      message: "Critical server error during session end",
      error: error.message,
    };
  }
};

export default endSession;
