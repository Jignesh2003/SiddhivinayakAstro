import PostgresDb from '../config/postgresDb.js';

/**
 * Atomically debits user, logs platform fee, credits astrologer net for a chat session end.
 * session = { _id, userId, astrologerId, amountCharged }
 */
async function createChatSessionTransaction(session) {
  const { _id, userId, astrologerId, amountCharged } = session;
  const amount = Number(amountCharged);

  // Platform commission & fee breakdown (customize as needed)
  const commissionPct = 0.20; // 20% platform
  const gstPct = 0.18;        // GST 18% (on commission)
  const gatewayPct = 0.02;    // Razorpay: 2%

  const platformFee = amount * commissionPct;
  const gstAmount = platformFee * gstPct;
  const paymentGatewayFee = amount * gatewayPct;
  const totalPlatformFee = platformFee + gstAmount + paymentGatewayFee;
  const astrologerNet = amount - totalPlatformFee;

  return await PostgresDb.transaction(async trx => {
    // 1. Fetch wallets (atomic for update - use 'forUpdate' in prod if heavy traffic)
const userIdStr = typeof userId === "string" ? userId : userId.toString();
const astrologerIdStr = typeof astrologerId === "string" ? astrologerId : astrologerId.toString();

const userWallet = await trx('wallet').where({ user_id: userIdStr }).forUpdate().first();
const astrologerWallet = await trx('wallet').where({ user_id: astrologerIdStr }).forUpdate().first();

if (!userWallet || !astrologerWallet) throw new Error("Wallets not found");

    if (Number(userWallet.balance) < amount) throw new Error("User has insufficient wallet balance");

    // PREPARE NEW BALANCES
    const userBalanceAfter = Number(userWallet.balance) - amount;
    const astroBalanceAfter = Number(astrologerWallet.balance) + astrologerNet;

    // 2. Debit user wallet
    await trx('wallet_transaction').insert({
      wallet_id: userWallet.id,
      chat_session_id: _id.toString(),
      direction: 'debit',
      business_type: 'chat_session_settle',
      amount,
      status: 'completed',
      from_user_id: userIdStr,
      to_user_id: astrologerIdStr,
      platform_fee: platformFee,
      gst_amount: gstAmount,
      payment_gateway_fee: paymentGatewayFee,
      description: 'Chat session debit: user pays for session end',
      balance_after: userBalanceAfter,
      meta: JSON.stringify({ netToAstrologer: astrologerNet }),
      created_at: trx.fn.now()
    });

    // 3. Credit astrologer (only net)
    await trx('wallet_transaction').insert({
      wallet_id: astrologerWallet.id,
      chat_session_id: _id.toString(),
      direction: 'credit',
      business_type: 'chat_session_settle',
      amount: astrologerNet,
      status: 'completed',
      from_user_id: userIdStr,
      to_user_id: astrologerIdStr,
      description: 'Chat session credit (net after platform fees)',
      balance_after: astroBalanceAfter,
      meta: JSON.stringify({ gross: amount, platformFee, gstAmount, paymentGatewayFee }),
      created_at: trx.fn.now()
    });

    // 4. (OPTIONAL BUT RECOMMENDED) Record platform fee in platform_collection:
    await trx('platform_collection').insert({
      chat_session_id: _id.toString(),
      gross_amount: amount,
      platform_commission: platformFee,
      gst_on_commission: gstAmount,
      payment_gateway_fee: paymentGatewayFee,
      total_platform_fee: totalPlatformFee,
      astrologer_payout: astrologerNet,
      created_at: trx.fn.now()
    });

    // 5. Apply wallet balance changes
    await trx('wallet')
      .where({ id: userWallet.id })
      .update({ balance: userBalanceAfter, updated_at: trx.fn.now() });
    await trx('wallet')
      .where({ id: astrologerWallet.id })
      .update({ balance: astroBalanceAfter, updated_at: trx.fn.now() });

    return {
      success: true,
      userBalanceAfter,
      astrologerBalanceAfter: astroBalanceAfter,
      astrologerNet,
      platformFee: totalPlatformFee
    };
  });
}

export default createChatSessionTransaction;
