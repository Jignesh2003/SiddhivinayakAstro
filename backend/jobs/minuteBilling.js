import cron from 'node-cron';
import ChatSession from '../models/chatSession.js';
import User from '../models/User.js';
import { getUserWalletBalance, deductFromWallet } from '../services/walletServices.js';
import endSession from '../utils/endSession.js';

let ioInstance = null;
export function initializeMinuteBillingCron(io) {
  ioInstance = io;

  cron.schedule('* * * * *', async () => {
    try {
      const sessions = await ChatSession.find({
        status: "approved",
        nextDebitAt: { $lte: new Date(Date.now() + 5000) } // 5 sec grace
      });

      for (const session of sessions) {
        const userId = session.userId.toString();
        const astro = await User.findById(session.astrologerId);
        if (!astro) {
          console.warn(`[MinuteBilling] Astrologer not found for session ${session._id}. Skipping.`);
          continue;
        }

        const balance = await getUserWalletBalance(userId);
        if (balance === null) {
          console.warn(`[MinuteBilling] User wallet not found for user ${userId} in session ${session._id}. Skipping.`);
          continue;
        }

        // Notify low balance *one minute BEFORE* debit if balance after debit would be insufficient
        if (balance < astro.pricePerMinute * 2) { // If user can pay only next minute or less
          if (ioInstance) {
            ioInstance.to(userId).emit("low-balance", {
              sessionId: session._id,
              message: "Warning: Your wallet balance is low! Please recharge or end the chat to avoid disconnection."
            });
          }
        }

        if (balance < astro.pricePerMinute) {
          console.log(`[MinuteBilling] Insufficient balance for user ${userId} in session ${session._id}. Ending session.`);

          // Fully end the session using your robust endSession handler with socket notification
          const result = await endSession(session._id, ioInstance);
          if (!result.success) {
            console.error(`[MinuteBilling] Failed ending session ${session._id}:`, result.message);
          } else {
            console.log(`[MinuteBilling] Session ${session._id} ended cleanly due to low balance.`);
          }
          continue; // No further debits
        }

        // Debit one minute from wallet
        const debitResult = await deductFromWallet({
          userId,
          amount: astro.pricePerMinute,
          businessType: 'chat_session_minute',
          chatSessionId: session._id,
          description: `Minute auto-debit for ongoing chat session ${session._id}`,
          meta: {}
        });

        if (!debitResult.success) {
          console.error(`[MinuteBilling] Debit failed for session ${session._id}:`, debitResult.error);
          // Optionally pause session or notify user here
          continue;
        }

        // INCREMENT minutesDebited after successful debit!
        session.minutesDebited = (session.minutesDebited || 0) + 1;
        session.nextDebitAt = new Date(Date.now() + 60 * 1000);
        await session.save();

        console.log(`[MinuteBilling] Debited ₹${astro.pricePerMinute} for user ${userId} on session ${session._id}. minutesDebited now ${session.minutesDebited}. Next debit at ${session.nextDebitAt.toISOString()}`);


        if (!debitResult.success) {
          console.error(`[MinuteBilling] Debit failed for session ${session._id}:`, debitResult.error);
          // Optionally pause session or notify user here
          continue;
        }

        // Update nextDebitAt to one minute later (schedule next debit)
        session.nextDebitAt = new Date(Date.now() + 60 * 1000);
        await session.save();

        console.log(`[MinuteBilling] Debited ₹${astro.pricePerMinute} for user ${userId} on session ${session._id}. Next debit at ${session.nextDebitAt.toISOString()}`);
      }
    } catch (err) {
      console.error("Minute billing cron error:", err);
    }
  });
}
