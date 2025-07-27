import cron from 'node-cron';
import ChatSession from '../models/chatSession.js';
import User from '../models/User.js';
import { getUserWalletBalance, deductFromWallet } from '../services/walletServices.js';
import endSession from '../utils/endSession.js'; // Your robust ending session handler

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    // Find all sessions approved and whose nextDebitAt is due (or within 5 seconds ahead)
    const sessions = await ChatSession.find({
      status: "approved",
      nextDebitAt: { $lte: new Date(Date.now() + 5000) } // 5 seconds grace to catch slight delays
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

      if (balance < astro.pricePerMinute) {
        console.log(`[MinuteBilling] Insufficient balance for user ${userId} in session ${session._id}. Ending session.`);

        // Call your full endSession logic to finalize session, billing, and notifications
        const result = await endSession(session._id /*, optionally pass io if you have socket instance here*/);

        if (!result.success) {
          console.error(`[MinuteBilling] Failed ending session ${session._id}:`, result.message);
        } else {
          console.log(`[MinuteBilling] Session ${session._id} ended cleanly due to low balance.`);
        }
        
        continue; // Skip further minute debit for this session
      }

      // Debit one minute cost from user wallet
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
        // Optional: mark session paused or notify
        continue;
      }

      // Update nextDebitAt to one minute later
      session.nextDebitAt = new Date(Date.now() + 60 * 1000);
      await session.save();

      console.log(`[MinuteBilling] Debited ₹${astro.pricePerMinute} for user ${userId} on session ${session._id}. Next debit at ${session.nextDebitAt.toISOString()}`);
    }
  } catch (err) {
    console.error("Minute billing cron error:", err);
  }
});
