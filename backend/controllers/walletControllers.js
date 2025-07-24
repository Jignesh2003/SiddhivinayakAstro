import PostgresDb from '../config/postgresDb.js';
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import PostgresDb from "../config/postgresDb.js";
import User from "../models/User.js";

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


export const initiateWalletTopupOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid wallet top-up request." });
    }

    // Fetch user email/phone for payment gateway payload
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Compose a unique wallet order_id
    const customOrderId = `WALLET_${userId}_${Date.now()}`;

    // Prepare Cashfree order (payment) payload
    const payload = {
      order_id: customOrderId,
      order_amount: Number(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: String(userId),
        customer_email: user.email,
        customer_phone: user.phone || "",
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/wallet?order_id=${customOrderId}&status={order_status}`,
        notify_url: process.env.CASHFREE_WEBHOOK_URL || "",
      },
      order_tags: {
        user: String(userId),
        intent: "wallet_topup"
      },
    };

    const headers = {
      "x-client-id": process.env.CASHFREE_CLIENT_ID,
      "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
      "x-api-version": "2023-08-01",
      "x-request-id": uuidv4(),
      "Content-Type": "application/json",
    };

    // Call Cashfree
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      payload,
      { headers }
    );

    const { payment_session_id, payment_link, checkout_url } = response.data;
    if (!payment_session_id) {
      return res.status(500).json({ message: "Cashfree did not return a payment session." });
    }

    // (Optional but recommended) Store a pending transaction or audit log if needed
    await PostgresDb('wallet_transaction').insert({
      wallet_id: null, // Will attach after webhook, if you wish
      type: 'credit',
      amount,
      status: 'initiated',
      description: `Pending wallet top-up order: ${customOrderId}`,
      from_user_id: userId,
      to_user_id: userId,
      payment_reference: customOrderId, // For audit and matching with webhook
    });

    // Respond with payment session data for frontend
    res.json({
      payment_session_id,
      payment_link,
      checkout_url,
      order_id: customOrderId,
      amount
    });

  } catch (err) {
    console.error("❌ Wallet top-up order creation failed:", err.message);
    res.status(500).json({ message: "Failed to initiate wallet top-up.", error: err.message });
  }
};
