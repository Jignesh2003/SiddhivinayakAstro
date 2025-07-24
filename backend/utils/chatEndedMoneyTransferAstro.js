import PostgresDb from '../config/postgresDb.js'; // Knex instance

/**
 * Atomically debits user and credits astrologer for chat session.
 * session: { _id, userId, astrologerId, amountCharged }
 */
async function createChatSessionTransaction(session) {
  const { _id, userId, astrologerId, amountCharged } = session;
  const amount = Number(amountCharged);

  // Use a Knex transaction for all actions
  return await PostgresDb.transaction(async trx => {
    // Fetch wallets
    const userWallet = await trx('wallet').where({ user_id: userId }).first();
    const astrologerWallet = await trx('wallet').where({ user_id: astrologerId }).first();

    if (!userWallet || !astrologerWallet) {
      throw new Error("Wallets missing for user or astrologer");
    }
    if (Number(userWallet.balance) < amount) {
      throw new Error("User has insufficient wallet balance");
    }

    // Debit user's wallet
    await trx('wallet_transaction').insert({
      wallet_id: userWallet.id,
      chat_session_id: _id.toString(),
      type: 'debit',
      amount,
      status: 'completed',
      from_user_id: userId,
      to_user_id: astrologerId,
      description: 'Chat session debit'
    });

    // Credit astrologer's wallet
    await trx('wallet_transaction').insert({
      wallet_id: astrologerWallet.id,
      chat_session_id: _id.toString(),
      type: 'credit',
      amount,
      status: 'completed',
      from_user_id: userId,
      to_user_id: astrologerId,
      description: 'Chat session credit'
    });

    // Update wallet balances
    await trx('wallet')
      .where({ id: userWallet.id })
      .update({ balance: Number(userWallet.balance) - amount, updated_at: trx.fn.now() });

    await trx('wallet')
      .where({ id: astrologerWallet.id })
      .update({ balance: Number(astrologerWallet.balance) + amount, updated_at: trx.fn.now() });
  });
}

export default createChatSessionTransaction;
