// jobs/minuteBilling.js
import cron from 'node-cron';
import ChatSession from '../models/chatSession.js';
import User from '../models/User.js';
import { getUserWalletBalance, deductFromWallet } from '../services/walletServices.js';

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = Date.now();
    const sessions = await ChatSession.find({
      status: "approved",
      nextDebitAt: { $lte: now }
    });

    for (const session of sessions) {
      const userId = session.userId.toString();
      const astro = await User.findById(session.astrologerId);
      const balance = await getUserWalletBalance(userId);
      if (!astro || balance === null) continue;
      if (balance < astro.pricePerMinute) {
        // Optionally: mark session ended/paused here
        session.status = "ended";
        session.endTime = new Date();
        await session.save();
        continue;
      }
      await deductFromWallet({
        userId,
        amount: astro.pricePerMinute,
        businessType: 'chat_session_minute',
        chatSessionId: session._id,
        description: `Minute auto-debit for ongoing chat`,
        meta: {}
      });
      session.nextDebitAt = new Date(Date.now() + 60*1000);
      await session.save();
    }
  } catch (err) {
    console.error("Minute billing cron error:", err);
  }
});
