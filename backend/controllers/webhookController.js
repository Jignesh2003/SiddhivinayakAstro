import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import PostgresDb from "../config/postgresDb.js";
import logTransactionToPostgres from "../utils/logTransaction.js";

// Helper: For pretty logs (optional)
function logWithTS(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

/**
 * Webhook from Cashfree/Razorpay to process payments safely.
 */
export const verifyPayment = async (req, res) => {
  try {
    // --- 1. Signature and basic validation ---
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

    // --- 2. Parse webhook JSON ---
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

    // --- 3. Handle Product Orders ("PREORDER_") as before ---
    const statusMap = {
      SUCCESS: {
        paymentStatus: "Paid",
        paymentMethod: "online",
        orderStatus: "Pending",
      },
      FAILED: {
        paymentStatus: "Failed",
        paymentMethod: "online",
        orderStatus: "Cancelled",
      },
      CANCELLED: {
        paymentStatus: "Cancelled",
        paymentMethod: "online",
        orderStatus: "Cancelled",
      },
    };
    const mongoUpdate = statusMap[paymentStatus];
    let updatedOrder = null;

    if (orderId.startsWith("PREORDER_") && mongoUpdate) {
      const mongoSession = await Order.startSession();
      try {
        await mongoSession.withTransaction(async () => {
          updatedOrder = await Order.findOneAndUpdate(
            { customOrderId: orderId },
            mongoUpdate,
            { session: mongoSession, new: true }
          );
          if (!updatedOrder) throw new Error(`No order found with customOrderId=${orderId}`);
          if (paymentStatus === "SUCCESS") {
            for (const item of updatedOrder.items) {
              const prodRes = await Product.findOneAndUpdate(
                { _id: item.product, "stock.quantity": { $gte: item.quantity } },
                { $inc: { "stock.$.quantity": -item.quantity } },
                { session: mongoSession, new: true }
              );
              if (!prodRes)
                throw new Error(
                  `Insufficient stock or product not found for: ${item.product}`
                );
            }
          }
        });
        mongoSession.endSession();
        logWithTS(`✅ Mongo order (${orderId}) status & stock processed: ${paymentStatus}`);
      } catch (err) {
        await mongoSession.abortTransaction();
        mongoSession.endSession();
        logWithTS("❌ MongoDB transaction failed:", err.message);
        return res.status(500).send("Order/stock update failed.");
      }
    }

    // --- 4. Handle Wallet Top-Ups ("WALLET_...") with ATOMIC SAFE PATTERN ---
    if (orderId.startsWith("WALLET_")) {
      try {
        await PostgresDb.transaction(async trx => {
          // ATOMICALLY set to completed if not already done, then proceed.
          const updatedTxnRows = await trx("wallet_transaction")
            .where({ payment_reference: orderId })
            .andWhere("status", "!=", "completed")
            .update({
              status: paymentStatus === "SUCCESS" ? "completed" : paymentStatus.toLowerCase(),
              business_type: paymentStatus === "SUCCESS" ? "wallet_topup" : undefined,
              updated_at: trx.fn.now(),
              description: `PG webhook: ${paymentStatus.toLowerCase()}`
            })
            .returning("*");

          if (!updatedTxnRows.length) {
            logWithTS(`ℹ️ Wallet transaction for ${orderId} already completed, skipping credit.`);
            return;
          }

          const txn = updatedTxnRows[0];
          if (paymentStatus === "SUCCESS") {
            // Lock and fetch wallet for safe balance update
            const wallet = await trx("wallet")
              .where({ id: txn.wallet_id })
              .forUpdate()
              .first();
            if (!wallet) throw new Error(`Wallet not found for wallet_id=${txn.wallet_id}`);

            const newBalance = Number(wallet.balance) + Number(paymentAmount);
            await trx("wallet")
              .where({ id: wallet.id })
              .update({
                balance: newBalance,
                updated_at: trx.fn.now()
              });
            await trx("wallet_transaction").where({ id: txn.id }).update({
              balance_after: newBalance
            });
            logWithTS(
              `✅ Wallet for user ${wallet.user_id} credited ₹${paymentAmount} via ${orderId}. New balance: ${newBalance}`
            );
          }
        });
      } catch (err) {
        logWithTS("❌ Wallet credit error:", err.message || err);
        return res.status(500).send("Wallet credit failed.");
      }
    }

    // --- 5. Postgres Transaction: log payment (atomic for audit) ---
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
      logWithTS("❌ Postgres logging failed after Mongo/Wallet commit:", pgErr.message || pgErr);
    }

    return res.status(200).send("✅ Webhook processed");
  } catch (err) {
    logWithTS("❌ verifyPayment controller error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
