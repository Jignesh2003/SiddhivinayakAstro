// controllers/wallet.controller.js

import PostgresDb from '../config/postgresDb.js';
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import User from "../models/User.js";
import calculateWithdrawDetails from '../utils/calaculateTax.js'; // implements your full fee/tax logic

// Show wallet balance
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
    res.json({ success: true, wallet });
  } catch (error) {
    console.error('🔥 Wallet fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add money to wallet - Only for manual/verified top-up (not async PG flow)

// export const addMoneyToWallet = async (req, res) => {
//   const userId = req.user.id;
//   const { amount, paymentReference } = req.body;

//   if (!amount || amount <= 0) {
//     return res.status(400).json({ error: 'Invalid amount' });
//   }

//   try {
//     await PostgresDb.transaction(async trx => {
//       const wallet = await trx('wallet')
//         .select('id', 'balance')
//         .where({ user_id: userId })
//         .first();

//       if (!wallet) throw new Error('Wallet not found');
//       const newBalance = Number(wallet.balance) + Number(amount);

//       // Insert transaction row
//       const [transaction] = await trx('wallet_transaction')
//         .insert({
//           wallet_id: wallet.id,
//           direction: 'credit',
//           business_type: 'wallet_topup',
//           amount,
//           status: 'completed',
//           description: `Top-up via ${paymentReference}`,
//           from_user_id: userId,
//           to_user_id: userId,
//           balance_after: newBalance,
//           meta: {} // extend if needed
//         })
//         .returning('*');

//       // Update wallet amount
//       await trx('wallet')
//         .update({ balance: newBalance, updated_at: trx.fn.now() })
//         .where({ id: wallet.id });

//       res.json({ success: true, message: 'Wallet topped up', newBalance, transaction });
//     });
//   } catch (err) {
//     console.error('🔥 Add money error:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };


// Request withdrawal with tax/fee deduction & parent/child transaction structure
export const withdrawFundsFromWallet = async (req, res) => {
  const userId = req.user.id;
  const { amount, withdrawalDetails } = req.body;

  if (!amount || amount <= 100) { // Example min withdrawal
    return res.status(400).json({ error: "Invalid amount" });
  }
  try {
    await PostgresDb.transaction(async trx => {
      const wallet = await trx('wallet')
        .select('id', 'balance')
        .where({ user_id: userId })
        .first();
      if (!wallet) throw new Error("Wallet not found");
      if (Number(wallet.balance) < Number(amount))
        throw new Error("Insufficient balance in wallet!");

      // 2. Calculate deductions
      const { tds, payoutFee, payoutFeeGst, netPayout } = calculateWithdrawDetails(Number(amount));
      const balanceAfter = Number(wallet.balance) - Number(amount);

      let meta = {
        tds, payoutFee, payoutFeeGst,
        withdrawalDetails, netPayout
      };

      // 3. Parent withdrawal txn
      const [withdrawTxn] = await trx('wallet_transaction')
        .insert({
          wallet_id: wallet.id,
          direction: 'debit',
          business_type: 'withdrawal_request', // or 'withdrawal' if instant
          amount,
          status: 'pending', // or 'completed'
          description: `Withdrawal requested: ${JSON.stringify(withdrawalDetails)}`,
          from_user_id: userId,
          to_user_id: null,
          platform_fee: payoutFee,
          gst_amount: payoutFeeGst,
          meta,
          balance_after: balanceAfter
        })
        .returning('*');

      // 4. Fee/tax child transactions for full audit
      // TDS debit
      await trx('wallet_transaction').insert({
        wallet_id: wallet.id,
        direction: 'debit',
        business_type: 'tds',
        amount: tds,
        status: 'completed',
        description: `TDS deducted on withdrawal`,
        from_user_id: userId,
        meta: { parent: withdrawTxn.id }
      });

      // Payout fee debit
      await trx('wallet_transaction').insert({
        wallet_id: wallet.id,
        direction: 'debit',
        business_type: 'payout_fee',
        amount: payoutFee,
        status: 'completed',
        description: `Payout fee`,
        from_user_id: userId,
        meta: { parent: withdrawTxn.id }
      });

      // Payout fee GST
      await trx('wallet_transaction').insert({
        wallet_id: wallet.id,
        direction: 'debit',
        business_type: 'payout_fee_gst',
        amount: payoutFeeGst,
        status: 'completed',
        description: `GST on payout fee`,
        from_user_id: userId,
        meta: { parent: withdrawTxn.id }
      });

      // Wallet deduction
      await trx('wallet')
        .where({ id: wallet.id })
        .update({ balance: balanceAfter, updated_at: trx.fn.now() });

      // (OPTIONAL) Trigger Razorpay payout here if auto, record ref.

      res.json({
        success: true,
        message: 'Withdrawal requested',
        requestedAmount: amount,
        netPayout,
        tds,
        payoutFee,
        payoutFeeGst,
        walletBalanceAfter: balanceAfter
      });
    });
  } catch (err) {
    console.error('🔥 Withdraw error:', err.message || err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};


// Initiate Wallet Top-up Order (Cashfree, Razorpay, etc.)
export const initiateWalletTopupOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid wallet top-up request." });
    }
    // Fetch user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const wallet = await PostgresDb('wallet')
      .select('id')
      .where({ user_id: userId })
      .first();
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found for user." });
    }
    const customOrderId = `WALLET_${userId}_${Date.now()}`;

    // Setup payment gateway payload (Cashfree example)
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

    // Call Cashfree to create order
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      payload,
      { headers }
    );
    const { payment_session_id, payment_link, checkout_url } = response.data;
    if (!payment_session_id) {
      return res.status(500).json({ message: "Cashfree did not return a payment session." });
    }

    // Insert pending transaction log
    await PostgresDb('wallet_transaction').insert({
      wallet_id: wallet.id,
      direction: 'credit',
      business_type: 'wallet_topup_initiated',
      amount,
      status: 'initiated',
      description: `Pending wallet top-up order: ${customOrderId}`,
      from_user_id: userId,
      to_user_id: userId,
      payment_reference: customOrderId,
      meta: {}
    });

    res.json({
      success: true,
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

export const listWalletTransactions = async (req, res) => {
  const userId = req.user.id;
  try {
    const wallet = await PostgresDb('wallet')
      .select('id')
      .where({ user_id: userId })
      .first();
    if (!wallet) return res.json([]);

    const transactions = await PostgresDb('wallet_transaction')
      .select(
        'id', 'chat_session_id', 'direction', 'business_type', 'amount',
        'status', 'description', 'created_at',
        'platform_fee', 'gst_amount', 'payment_gateway_fee', 'balance_after', 'meta'
      )
      .where({ wallet_id: wallet.id })
      .orderBy('created_at', 'desc')
      .limit(50);

    res.json({ success: true, transactions });
  } catch (error) {
    console.error('🔥 Transaction list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

