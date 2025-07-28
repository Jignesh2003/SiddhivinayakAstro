import PostgresDb from '../config/postgresDb.js';

/**
 * Settles a chat session at end: credits astrologer net (after platform fees/GST)
 * All user debits should already be done per minute during the session!
 * session = { _id, userId, astrologerId, amountCharged }
 */
async function createChatSessionTransaction(session) {
  const { _id, userId, astrologerId, amountCharged } = session;
  const amount = Number(amountCharged);

  // Configure fee percentages
  const commissionPct = 0.20; // 20% platform
  const gstPct = 0.18;        // GST 18% (on commission)
  const gatewayPct = 0.02;    // Razorpay: 2%

  // Calculate fee and net payout
  const platformFee = amount * commissionPct;
  const gstAmount = platformFee * gstPct;
  const paymentGatewayFee = amount * gatewayPct;
  const totalPlatformFee = platformFee + gstAmount + paymentGatewayFee;
  const astrologerNet = amount - totalPlatformFee;

  return await PostgresDb.transaction(async trx => {
    // 1. Fetch astrologer wallet
    const astrologerIdStr = typeof astrologerId === "string" ? astrologerId : astrologerId.toString();
    const astrologerWallet = await trx('wallet').where({ user_id: astrologerIdStr }).forUpdate().first();
    if (!astrologerWallet) throw new Error("Astrologer's wallet not found");

    const astroBalanceAfter = Number(astrologerWallet.balance) + astrologerNet;

    // 2. CREDIT astrologer's wallet with net payout (do NOT debit user here!)
    await trx('wallet_transaction').insert({
      wallet_id: astrologerWallet.id,
      chat_session_id: _id.toString(),
      direction: 'credit',
      business_type: 'chat_session_settlement',
      amount: astrologerNet,
      status: 'completed',
      from_user_id: userId,                  // Trace source user for audit
      to_user_id: astrologerIdStr,
      description: 'Chat session payout (platform settles with astrologer net after fee)',
      balance_after: astroBalanceAfter,
      payment_gateway_fee : paymentGatewayFee,
      gst_amount : gstAmount,
      platform_fee : platformFee,
      total_platform_fee:totalPlatformFee,
      payment_refrence : "WALLET TRANSFER FOR CHAT",
      meta: JSON.stringify({
        gross: amount,
        platformFee,
        gstAmount,
        paymentGatewayFee,
        totalPlatformFee,
      }),
      created_at: trx.fn.now(),
    });

    // 3. Update astrologer's wallet balance
    await trx('wallet')
      .where({ id: astrologerWallet.id })
      .update({ balance: astroBalanceAfter, updated_at: trx.fn.now() });

    return {
      success: true,
      astrologerBalanceAfter: astroBalanceAfter,
      astrologerNet,
      platformFee: totalPlatformFee
    };
  });
}

export default createChatSessionTransaction;
