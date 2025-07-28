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
// export const withdrawFundsFromWallet = async (req, res) => {
//   const userId = req.user.id;
//   const { amount, withdrawalDetails } = req.body;
//   if (!amount || amount < 500) { // Fixed comparison!
//     return res.status(400).json({ error: "Minimum withdrawal is ₹500" });
//   }
//   try {
//     await PostgresDb.transaction(async trx => {
//       const wallet = await trx('wallet')
//         .select('id', 'balance')
//         .where({ user_id: userId })
//         .first();
//       if (!wallet) throw new Error("Wallet not found");
//       if (Number(wallet.balance) < Number(amount))
//         throw new Error("Insufficient balance in wallet!");

//       const { tds, payoutFee, payoutFeeGst, netPayout } =
//         calculateWithdrawDetails(Number(amount));
//       const balanceAfter = Number(wallet.balance) - Number(amount);

//       let meta = {
//         tds, payoutFee, payoutFeeGst,
//         withdrawalDetails, netPayout
//       };

//       // 3. Parent withdrawal txn
//       const [withdrawTxn] = await trx('wallet_transaction')
//         .insert({
//           wallet_id: wallet.id,
//           direction: 'debit',
//           business_type: 'withdrawal_request',
//           amount,
//           status: 'pending',
//           description: `Withdrawal requested: ${JSON.stringify(withdrawalDetails)}`,
//           from_user_id: userId,
//           to_user_id: null,
//           platform_fee: payoutFee,
//           gst_amount: payoutFeeGst,
//           meta: JSON.stringify(meta),        // ensure this is a string!
//           balance_after: balanceAfter
//         })
//         .returning('*');

//       // Child transactions
//       await trx('wallet_transaction').insert([
//         {
//           wallet_id: wallet.id,
//           direction: 'debit',
//           business_type: 'tds',
//           amount: tds,
//           status: 'completed',
//           description: `TDS deducted on withdrawal`,
//           from_user_id: userId,
//           meta: JSON.stringify({ parent: withdrawTxn.id })
//         },
//         {
//           wallet_id: wallet.id,
//           direction: 'debit',
//           business_type: 'payout_fee',
//           amount: payoutFee,
//           status: 'completed',
//           description: `Payout fee`,
//           from_user_id: userId,
//           meta: JSON.stringify({ parent: withdrawTxn.id })
//         },
//         {
//           wallet_id: wallet.id,
//           direction: 'debit',
//           business_type: 'payout_fee_gst',
//           amount: payoutFeeGst,
//           status: 'completed',
//           description: `GST on payout fee`,
//           from_user_id: userId,
//           meta: JSON.stringify({ parent: withdrawTxn.id })
//         }
//       ]);

//       await trx('wallet')
//         .where({ id: wallet.id })
//         .update({ balance: balanceAfter, updated_at: trx.fn.now() });

//       res.json({
//         success: true,
//         transactionId: withdrawTxn.id,
//         message: 'Withdrawal requested',
//         requestedAmount: amount,
//         netPayout,
//         tds,
//         payoutFee,
//         payoutFeeGst,
//         walletBalanceAfter: balanceAfter
//       });
//     });
//   } catch (err) {
//     console.error('🔥 Withdraw error:', err.message || err);
//     res.status(500).json({ error: err.message || 'Internal server error' });
//   }
// };


export const withdrawFundsFromWallet = async (req, res) => {
  const userId = req.user.id;
  const { amount, withdrawalDetails } = req.body;

  // Enforce minimum withdrawal
  if (!amount || amount < 500) {
    return res.status(400).json({ error: "Minimum withdrawal is ₹500" });
  }

  try {
    await PostgresDb.transaction(async trx => {
      // 1. Lock wallet row for safe balance deduction
      const wallet = await trx('wallet')
        .select('id', 'balance')
        .where({ user_id: userId })
        .first();
      if (!wallet) throw new Error("Wallet not found");

      if (Number(wallet.balance) < Number(amount)) {
        throw new Error("Insufficient balance in wallet!");
      }

      const balanceAfter = Number(wallet.balance) - Number(amount);

      // 2. Log parent transaction only (no fees/tds)
      const [withdrawTxn] = await trx('wallet_transaction')
        .insert({
          wallet_id: wallet.id,
          direction: 'debit',
          business_type: 'withdrawal_request',
          amount,
          status: 'pending',
          description: withdrawalDetails
            ? `Withdrawal requested: ${JSON.stringify(withdrawalDetails)}`
            : `Withdrawal requested`,
          from_user_id: userId,
          to_user_id: null,
          balance_after: balanceAfter,
          meta: withdrawalDetails
            ? JSON.stringify({ withdrawalDetails })
            : JSON.stringify({}),
          created_at: trx.fn.now()
        })
        .returning('*');

      // 3. Deduct from wallet
      await trx('wallet')
        .where({ id: wallet.id })
        .update({ balance: balanceAfter, updated_at: trx.fn.now() });

      res.json({
        success: true,
        transactionId: withdrawTxn.id,
        message: 'Withdrawal requested',
        requestedAmount: amount,
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

/**
 * List wallet withdrawal requests for admin, newest first.
 * GET params: ?status=pending|completed (optional), ?limit=50, ?offset=0
 */
export const getWithdrawalRequests = async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  try {
    let query = PostgresDb('wallet_transaction')
      .where('business_type', 'withdrawal_request')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (status) {
      query = query.andWhere('status', status);
    }

    // Optionally join for user info:
    // .leftJoin('user', 'wallet_transaction.from_user_id', 'user.id')
    // .select('wallet_transaction.*', 'user.name', 'user.email')

    const requests = await query.select();

    res.json({
      success: true,
      count: requests.length,
      withdrawals: requests
    });
  } catch (err) {
    console.error('🔥 Admin getWithdrawals error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Assumes admin JWT auth middleware is applied
export const updateWithdrawalStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "completed" or "rejected"
  if (!["completed", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    await PostgresDb.transaction(async trx => {
      // 1. Find withdrawal txn
      const wd = await trx('wallet_transaction')
        .where({ id, business_type: 'withdrawal_request' })
        .first();

      if (!wd) throw new Error("Withdrawal request not found");
      if (wd.status !== "pending")
        throw new Error("This withdrawal is already processed.");

      // 2. If rejected, refund user
      if (status === "rejected") {
        // Credit the same amount back as a refund txn
        await trx('wallet_transaction').insert({
          wallet_id: wd.wallet_id,
          direction: 'credit',
          business_type: 'withdrawal_refund',
          amount: wd.amount,
          status: 'completed',
          description: 'Withdrawal rejected, funds returned',
          from_user_id: null,
          to_user_id: wd.from_user_id,
          meta: JSON.stringify({ refundFor: id }),
          balance_after: null, // You can update with the actual computed balance if desired
          created_at: trx.fn.now(),
        });
        // Increment balance in wallet table
        await trx('wallet')
          .where({ id: wd.wallet_id })
          .increment('balance', wd.amount)
          .update({ updated_at: trx.fn.now() });
      }

      // 3. Update original withdrawal txn status
      await trx('wallet_transaction')
        .where({ id })
        .update({
          status,
          updated_at: trx.fn.now()
        });

      res.json({
        success: true,
        newStatus: status,
        message: status === "completed"
          ? "Withdrawal marked as successful."
          : "Withdrawal rejected and funds refunded."
      });
    });
  } catch (err) {
    console.error("Admin withdrawal status update error:", err);
    res.status(500).json({ error: err.message || "Failed to update withdrawal" });
  }
};
