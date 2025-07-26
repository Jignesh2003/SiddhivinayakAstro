import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import PostgresDb from "../config/postgresDb.js";
import logTransactionToPostgres from "../utils/logTransaction.js";

// Helper: For pretty logs
function logWithTS(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

export const verifyPayment = async (req, res) => {
  try {
    // --- 1. Validate webhook signature ---
    if (!Buffer.isBuffer(req.body)) {
      logWithTS("❌ Invalid webhook format: body is not raw Buffer");
      return res.status(400).send("Invalid webhook format");
    }
    const rawBody = req.body.toString("utf8");
    const timestamp = req.headers["x-webhook-timestamp"];
    const incomingSignature = req.headers["x-webhook-signature"];
    if (!timestamp || !incomingSignature) {
      return res.status(400).send("Missing signature headers");
    }
    const computedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET)
      .update(`${timestamp}${rawBody}`, "utf8")
      .digest("base64");
    if (computedSignature !== incomingSignature) {
      return res.status(400).send("Invalid signature");
    }

    // --- 2. Parse JSON payload ---
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return res.status(400).send("Invalid JSON");
    }
    const eventType = payload?.type;
    const data = payload?.data;
    const eventTime = payload?.event_time;
    if (!eventType || !data || !eventTime) {
      return res.status(400).send("Malformed webhook");
    }

    const {
      order: { order_id: orderId } = {},
      payment: {
        cf_payment_id: cfPaymentId,
        payment_status: paymentStatus,
        payment_amount: paymentAmount,
        payment_currency: paymentCurrency,
        payment_method: paymentMethod,
        cf_order_id: cfOrderId,
      } = {},
      customer_details: {
        customer_email: customerEmail,
        customer_phone: customerPhone,
      } = {},
    } = data;

    if (!cfPaymentId || !orderId) {
      return res.status(200).send("Skipped: Incomplete payment data");
    }

    // --- 3. Handle Product Orders ---
    // (Omitted here since it's not related to wallet)

    // --- 4. Handle Wallet Top-Ups ---
    if (orderId.startsWith("WALLET_")) {
      try {
        await PostgresDb.transaction(async trx => {
          // Step 1: Lock wallet_transaction row for update with appropriate condition
          const txn = await trx("wallet_transaction")
            .where({ payment_reference: orderId })
            .forUpdate()
            .first();

          if (!txn) {
            logWithTS(`❌ No wallet_transaction found for payment_reference=${orderId}`);
            throw new Error("No pending wallet transaction for this payment");
          }

          logWithTS(`Wallet transaction ${txn.id} current status: ${txn.status}`);

          // Step 2: if transaction already completed, avoid double credit
          if (txn.status === "completed") {
            logWithTS(`ℹ️ Wallet transaction ${orderId} already completed. Skipping.`);
            return;
          }

          // Step 3: Lock the user's wallet row (to safely update balance)
          const wallet = await trx("wallet")
            .where({ id: txn.wallet_id })
            .forUpdate()
            .first();

          if (!wallet) throw new Error(`Wallet not found for wallet_id=${txn.wallet_id}`);

          // Step 4: Prepare updates
          const updateTxn = {
            status: paymentStatus === "SUCCESS" ? "completed" : paymentStatus.toLowerCase(),
            business_type: paymentStatus === "SUCCESS" ? "wallet_topup" : txn.business_type,
            updated_at: trx.fn.now(),
            description: `PG webhook: ${paymentStatus.toLowerCase()}`,
          };

          if (paymentStatus === "SUCCESS") {
            const newBalance = Number(wallet.balance) + Number(paymentAmount);

            // Step 5: Update wallet_transaction and wallet atomically
            await trx("wallet_transaction").where({ id: txn.id }).update({
              ...updateTxn,
              balance_after: newBalance,
            });
            await trx("wallet").where({ id: wallet.id }).update({
              balance: newBalance,
              updated_at: trx.fn.now(),
            });

            logWithTS(
              `✅ Wallet for user ${wallet.user_id} credited ₹${paymentAmount} via ${orderId}. New balance: ${newBalance}`
            );
          } else {
            // Mark wallet_transaction as failed/cancelled/correct status without touching wallet
            await trx("wallet_transaction").where({ id: txn.id }).update(updateTxn);
            logWithTS(
              `ℹ️ Wallet transaction for ${orderId} updated to status ${paymentStatus}`
            );
          }
        });
      } catch (err) {
        logWithTS("❌ Wallet credit error:", err.message || err);
        return res.status(500).send("Wallet credit failed.");
      }
    }

    // --- 5. Log payment event ---
    try {
      await PostgresDb.transaction(async trx => {
        await logTransactionToPostgres(
          {
            order_id: orderId,
            cf_order_id: cfOrderId || null,
            cf_payment_id: cfPaymentId,
            status: paymentStatus,
            amount: paymentAmount,
            currency: paymentCurrency,
            payment_method: JSON.stringify(paymentMethod || {}),
            payment_time: eventTime,
            email: customerEmail,
            phone: customerPhone,
            signature: incomingSignature,
          },
          trx
        );
      });
      logWithTS("✅ Postgres: Payment event logged");
    } catch (pgErr) {
      logWithTS("❌ Postgres logging failed:", pgErr.message || pgErr);
    }

    return res.status(200).send("✅ Webhook processed");
  } catch (err) {
    logWithTS("❌ verifyPayment controller error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
