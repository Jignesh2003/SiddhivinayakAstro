import db from '../config/postgresDb.js'; // Adjust path as needed

// show wallet current money
export const myWallet = async (req, res) => {
  const userId = req.user.id; // assuming auth middleware sets req.user

  try {
    const { rows } = await db.query(
      `SELECT balance, currency, status, created_at, updated_at 
       FROM wallet WHERE user_id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// list wallet transactions
export const listWalletTransactions = async (req, res) => {
  const userId = req.user.id;

  try {
    // First get wallet id
    const walletResult = await db.query(`SELECT id FROM wallet WHERE user_id = $1`, [userId]);
    if (walletResult.rows.length === 0) return res.json([]);

    const walletId = walletResult.rows[0].id;

    // Get transactions for this wallet
    const { rows } = await db.query(
      `SELECT id, chat_session_id, type, amount, status, description, created_at 
       FROM wallet_transaction WHERE wallet_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [walletId]
    );
    res.json(rows);
  } catch (error) {
    console.error("List transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


export const addMoneyToWallet =  async (req, res) => {
  const userId = req.user.id;
  const { amount, paymentReference } = req.body;

  if (amount <= 0) return res.status(400).json({ error: "Invalid amount" });

  try {
    // Get wallet
    const walletResult = await db.query(`SELECT id, balance FROM wallet WHERE user_id = $1`, [userId]);
    if (!walletResult.rows.length) return res.status(404).json({ error: "Wallet not found" });

    const wallet = walletResult.rows[0];

    // Insert transaction record as credit, pending initially
    const txnResult = await db.query(
      `INSERT INTO wallet_transaction (wallet_id, type, amount, status, description, from_user_id, to_user_id)
       VALUES ($1,'credit',$2,'completed',$3,$4,$4) RETURNING *`,
      [wallet.id, amount, `Top-up via ${paymentReference}`, userId]
    );

    // Update wallet balance
    const newBalance = Number(wallet.balance) + Number(amount);
    await db.query(`UPDATE wallet SET balance = $1, updated_at = NOW() WHERE id = $2`, [newBalance, wallet.id]);

    res.json({ message: "Wallet topped up", newBalance, transaction: txnResult.rows[0] });
  } catch (err) {
    console.error("Add money error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}


export const withrawFundsFromWallet =  async (req, res) => {
  const userId = req.user.id;
  const { amount, withdrawalDetails } = req.body;

  if (amount <= 0) return res.status(400).json({ error: "Invalid amount" });

  try {
    // Get wallet info
    const walletResult = await db.query(`SELECT id, balance FROM wallet WHERE user_id = $1`, [userId]);
    if (!walletResult.rows.length) return res.status(404).json({ error: "Wallet not found" });

    const wallet = walletResult.rows[0];

    if (Number(wallet.balance) < Number(amount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Insert withdrawal transaction debit
    const txnResult = await db.query(
      `INSERT INTO wallet_transaction (wallet_id, type, amount, status, description, from_user_id, to_user_id)
       VALUES ($1, 'debit', $2, 'pending', $3, $4, NULL) RETURNING *`,
      [wallet.id, amount, `Withdrawal requested: ${JSON.stringify(withdrawalDetails)}`, userId]
    );

    // Deduct balance immediately or after approval depending on your flow
    const newBalance = Number(wallet.balance) - Number(amount);
    await db.query(`UPDATE wallet SET balance = $1, updated_at = NOW() WHERE id = $2`, [newBalance, wallet.id]);

    res.json({ message: "Withdrawal requested", newBalance, transaction: txnResult.rows[0] });
  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}


