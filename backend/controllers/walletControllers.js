import PostgresDb from '../config/postgresDb.js';

// ✅ Show wallet balance
export const myWallet = async (req, res) => {
  const userId = req.user.id;

  try {
    const wallet = await PostgresDb('wallet')
      .select('balance', 'currency', 'status', 'created_at', 'updated_at')
      .where({ user_id: userId })
      .first();

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    res.json(wallet);
  } catch (error) {
    console.error('🔥 Wallet fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// ✅ List wallet transactions
export const listWalletTransactions = async (req, res) => {
  const userId = req.user.id;

  try {
    const wallet = await PostgresDb('wallet')
      .select('id')
      .where({ user_id: userId })
      .first();

    if (!wallet) return res.json([]);

    const transactions = await PostgresDb('wallet_transaction')
      .select('id', 'chat_session_id', 'type', 'amount', 'status', 'description', 'created_at')
      .where({ wallet_id: wallet.id })
      .orderBy('created_at', 'desc')
      .limit(50);

    res.json(transactions);
  } catch (error) {
    console.error('🔥 Transaction list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// ✅ Add money to wallet
export const addMoneyToWallet = async (req, res) => {
  const userId = req.user.id;
  const { amount, paymentReference } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    await PostgresDb.transaction(async trx => {
      const wallet = await trx('wallet')
        .select('id', 'balance')
        .where({ user_id: userId })
        .first();

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Step 1: Create transaction
      const [transaction] = await trx('wallet_transaction')
        .insert({
          wallet_id: wallet.id,
          type: 'credit',
          amount,
          status: 'completed',
          description: `Top-up via ${paymentReference}`,
          from_user_id: userId,
          to_user_id: userId
        })
        .returning('*');

      // Step 2: Update wallet
      const newBalance = Number(wallet.balance) + Number(amount);
      await trx('wallet')
        .update({ balance: newBalance, updated_at: trx.fn.now() })
        .where({ id: wallet.id });

      res.json({ message: 'Wallet topped up', newBalance, transaction });
    });
  } catch (err) {
    console.error('🔥 Add money error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// ✅ Withdraw funds from wallet
export const withrawFundsFromWallet = async (req, res) => {
  const userId = req.user.id;
  const { amount, withdrawalDetails } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    await PostgresDb.transaction(async trx => {
      const wallet = await trx('wallet')
        .select('id', 'balance')
        .where({ user_id: userId })
        .first();

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (Number(wallet.balance) < Number(amount)) {
        throw new Error('Insufficient balance');
      }

      // Step 1: Create withdrawal transaction (pending)
      const [transaction] = await trx('wallet_transaction')
        .insert({
          wallet_id: wallet.id,
          type: 'debit',
          amount,
          status: 'pending', // approval flow logic can handle later
          description: `Withdrawal requested: ${JSON.stringify(withdrawalDetails)}`,
          from_user_id: userId,
          to_user_id: null
        })
        .returning('*');

      // Step 2: Deduct balance
      const newBalance = Number(wallet.balance) - Number(amount);
      await trx('wallet')
        .update({ balance: newBalance, updated_at: trx.fn.now() })
        .where({ id: wallet.id });

      res.json({ message: 'Withdrawal requested', newBalance, transaction });
    });
  } catch (err) {
    console.error('🔥 Withdraw error:', err.message || err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

