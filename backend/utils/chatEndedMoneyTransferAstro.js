import db from '../config/postgresDb.js'; // Adjust path as needed


async function createChatSessionTransaction(session) {
  // session: { _id, userId, astrologerId, amountCharged }

  try {
    // Fetch wallets for both users
    const userWalletRes = await db.query(`SELECT id, balance FROM wallet WHERE user_id = $1`, [session.userId]);
    const astrologerWalletRes = await db.query(`SELECT id FROM wallet WHERE user_id = $1`, [session.astrologerId]);
    
    if (!userWalletRes.rows.length || !astrologerWalletRes.rows.length) {
      throw new Error("Wallets missing for user or astrologer");
    }
    
    const userWallet = userWalletRes.rows[0];
    const astrologerWallet = astrologerWalletRes.rows[0];
    const amount = Number(session.amountCharged);

    if (userWallet.balance < amount) {
      throw new Error("User has insufficient wallet balance");
    }

    // Begin transaction block
    await db.query('BEGIN');

    // Debit user wallet
    await db.query(
      `INSERT INTO wallet_transaction (wallet_id, chat_session_id, type, amount, status, from_user_id, to_user_id, description)
       VALUES ($1, $2, 'debit', $3, 'completed', $4, $5, $6)`,
      [userWallet.id, session._id.toString(), amount, session.userId, session.astrologerId, 'Chat session debit']
    );

    // Credit astrologer wallet
    await db.query(
      `INSERT INTO wallet_transaction (wallet_id, chat_session_id, type, amount, status, from_user_id, to_user_id, description)
       VALUES ($1, $2, 'credit', $3, 'completed', $4, $5, $6)`,
      [astrologerWallet.id, session._id.toString(), amount, session.userId, session.astrologerId, 'Chat session credit']
    );

    // Update balances
    await db.query(`UPDATE wallet SET balance = balance - $1 WHERE id = $2`, [amount, userWallet.id]);
    await db.query(`UPDATE wallet SET balance = balance + $1 WHERE id = $2`, [amount, astrologerWallet.id]);

    await db.query('COMMIT');

  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}

export default createChatSessionTransaction;