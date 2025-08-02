import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import PostgresDb from "../config/postgresDb.js";
import logTransactionToPostgres from "../utils/logTransaction.js";

// Helper for clearly tagged logs
function logWithTS(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

export const verifyPayment = async (req, res) => {
  // Unique id per webhook for trace/debug in logs
  const requestId = crypto.randomBytes(5).toString("hex");
  logWithTS(`[${requestId}] 🔔 Webhook received`);

  try {
    // 1. Signature and payload validation
    if (!Buffer.isBuffer(req.body)) {
      logWithTS(`[${requestId}] ❌ Invalid webhook format: not a Buffer`);
      return res.status(400).send("Invalid webhook format");
    }
    const rawBody = req.body.toString("utf8");
    const timestamp = req.headers["x-webhook-timestamp"];
    const incomingSignature = req.headers["x-webhook-signature"];
    if (!timestamp || !incomingSignature) {
      logWithTS(`[${requestId}] ❌ Missing webhook signature headers`);
      return res.status(400).send("Missing signature headers");
    }
    const computedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET)
      .update(`${timestamp}${rawBody}`, "utf8")
      .digest("base64");
    if (computedSignature !== incomingSignature) {
      logWithTS(`[${requestId}] ❌ Invalid webhook signature`);
      return res.status(400).send("Invalid signature");
    }

    // 2. Parse webhook
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      logWithTS(`[${requestId}] ❌ Invalid JSON`);
      return res.status(400).send("Invalid JSON");
    }
    const eventType = payload?.type;
    const data = payload?.data;
    const eventTime = payload?.event_time;
    if (!eventType || !data || !eventTime) {
      logWithTS(`[${requestId}] ❌ Malformed webhook: missing fields`);
      return res.status(400).send("Malformed webhook");
    }

    // Extract needed values
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
      logWithTS(`[${requestId}] ⚠️ Webhook missing cf_payment_id or order_id`);
      return res.status(200).send("Skipped: Incomplete payment data");
    }

    logWithTS(`[${requestId}] 📝 Handling orderId=${orderId} status=${paymentStatus} amount=${paymentAmount}`);

    // --- Handle PREORDER_xxx payments in Mongo ---
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
        logWithTS(`[${requestId}] ⚙️ Starting Mongo order payment update`);
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
                throw new Error(`Insufficient stock or product not found for: ${item.product}`);
            }
          }
        });
        mongoSession.endSession();
        logWithTS(`[${requestId}] ✅ Mongo order ${orderId} status/stock processed: ${paymentStatus}`);
      } catch (err) {
        await mongoSession.abortTransaction();
        mongoSession.endSession();
        logWithTS(`[${requestId}] ❌ MongoDB order/stock update failed:`, err.message);
        return res.status(500).send("Order/stock update failed.");
      }


      try {
        await PostgresDb.transaction(async (trx) => {
          const updatedRows = await trx("productorders_transactions")
            .where({ order_id: orderId })
            .update({
              cf_order_id: cfOrderId || null,
              cf_payment_id: cfPaymentId,
              status: paymentStatus,                  // Update status based on webhook data
              amount: paymentAmount,
              currency: paymentCurrency,
              payment_method: JSON.stringify(paymentMethod || {}),
              payment_time: eventTime,  // Convert epoch to JS Date
              email: customerEmail,
              phone: customerPhone,
              signature: incomingSignature,
            });

          if (updatedRows === 0) {
            logWithTS(`[${requestId}] ⚠️ No matching productorders_transactions record found for order_id=${orderId}`);
            // Optionally: handle missing record, e.g., insert, alert, or log
          } else {
            logWithTS(`[${requestId}] 📝 Postgres audit log updated for order_id=${orderId}`);
          }
        });
      } catch (pgErr) {
        logWithTS(`[${requestId}] ❌ Postgres audit log update failed for orderId=${orderId}:`, pgErr.message || pgErr);
        // Optionally: handle error further (alert, retry, etc.)
      }

    }

    // --- Handle WALLET_xxx wallet top-ups ---
    if (orderId.startsWith("WALLET_")) {
      try {
        await PostgresDb.transaction(async trx => {
          logWithTS(`[${requestId}] 🔒 Checking/locking wallet transaction for '${orderId}'`);
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
            logWithTS(`[${requestId}] ℹ️ Already completed/skipped wallet transaction for ${orderId}.`);
            return;
          }

          const txn = updatedTxnRows[0];

          // Credit wallet only if payment SUCCESS
          if (paymentStatus === "SUCCESS") {
            const wallet = await trx("wallet")
              .where({ id: txn.wallet_id })
              .forUpdate()
              .first();
            if (!wallet) throw new Error(`Wallet not found for id=${txn.wallet_id}`);

            const newBalance = Number(wallet.balance) + Number(paymentAmount);
            logWithTS(
              `[${requestId}] 💸 Crediting wallet userId=${wallet.user_id} +₹${paymentAmount} (was: ${wallet.balance}, now: ${newBalance})`
            );

            await trx("wallet").where({ id: wallet.id }).update({
              balance: newBalance,
              updated_at: trx.fn.now()
            });
            await trx("wallet_transaction").where({ id: txn.id }).update({
              balance_after: newBalance
            });

            logWithTS(`[${requestId}] ✅ WALLET UPDATED/CREATED: user ${wallet.user_id}, orderId=${orderId} @${newBalance}`);
          }
        });
      } catch (err) {
        logWithTS(`[${requestId}] ❌ Wallet credit error:`, err.message || err);
        return res.status(500).send("Wallet credit failed.");
      }
    }
    if (orderId.startsWith("PRE_KUNDLI_") || orderId.startsWith("PRE_K")) {
      try {
        await PostgresDb.transaction(async trx => {
          // Insert payment event into premium_services_payment table
          await trx("premium_services_payment").insert({
            order_id: orderId,
            cf_order_id: cfOrderId || null,
            cf_payment_id: cfPaymentId,
            status: paymentStatus,
            amount: paymentAmount,
            currency: paymentCurrency,
            payment_method: JSON.stringify(paymentMethod || {}),
            payment_time: eventTime,  // convert epoch seconds to JS Date
            customer_email: customerEmail,
            customer_phone: customerPhone,
            signature: incomingSignature,
            extra_payload: JSON.stringify(payload),
            audit_logged_at: trx.fn.now(),
          }).onConflict("order_id")
            .merge(); // Ensures only one row per order_id, always latest status
        });
        logWithTS(`[${requestId}] 📝 PG audit log: premium services payment event for ${orderId}`);
      } catch (pgErr) {
        logWithTS(`[${requestId}] ❌ PG audit log failed for premium services:`, pgErr.message || pgErr);
        return res.status(500).send("Postgres insert failed.");
      }
    }

    if (orderId.startsWith("PRE_PANCH_") || orderId.startsWith("PRE_P")) {
      try {
        await PostgresDb.transaction(async trx => {
          // Insert payment event into premium_services_payment table
          await trx("premium_services_payment").insert({
            order_id: orderId,
            cf_order_id: cfOrderId || null,
            cf_payment_id: cfPaymentId,
            status: paymentStatus,
            amount: paymentAmount,
            currency: paymentCurrency,
            payment_method: JSON.stringify(paymentMethod || {}),
            payment_time: eventTime,  // convert epoch seconds to JS Date
            customer_email: customerEmail,
            customer_phone: customerPhone,
            signature: incomingSignature,
            extra_payload: JSON.stringify(payload),
            audit_logged_at: trx.fn.now(),
          }).onConflict("order_id")
            .merge(); // Ensures only one row per order_id, always latest status
        });

        if (orderId.startsWith("PRE_MATCH_") || orderId.startsWith("PRE_M")) {
          try {
            await PostgresDb.transaction(async trx => {
              // Insert payment event into premium_services_payment table
              await trx("premium_services_payment").insert({
                order_id: orderId,
                cf_order_id: cfOrderId || null,
                cf_payment_id: cfPaymentId,
                status: paymentStatus,
                amount: paymentAmount,
                currency: paymentCurrency,
                payment_method: JSON.stringify(paymentMethod || {}),
                payment_time: eventTime,  // convert epoch seconds to JS Date
                customer_email: customerEmail,
                customer_phone: customerPhone,
                signature: incomingSignature,
                extra_payload: JSON.stringify(payload),
                audit_logged_at: trx.fn.now(),
              }).onConflict("order_id")
                .merge(); // Ensures only one row per order_id, always latest status
            });
            logWithTS(`[${requestId}] 📝 PG audit log: premium services payment event for ${orderId}`);
          } catch (pgErr) {
            logWithTS(`[${requestId}] ❌ PG audit log failed for premium services:`, pgErr.message || pgErr);
            return res.status(500).send("Postgres insert failed.");
          }
        }
        logWithTS(`[${requestId}] 📝 PG audit log: premium services payment event for ${orderId}`);
      } catch (pgErr) {
        logWithTS(`[${requestId}] ❌ PG audit log failed for premium services:`, pgErr.message || pgErr);
        return res.status(500).send("Postgres insert failed.");
      }
    }
    // --- Audit payment event in Postgres ---
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
      logWithTS(`[${requestId}] 📝 PG audit log: payment event for ${orderId}`);
    } catch (pgErr) {
      logWithTS(`[${requestId}] ❌ PG audit log failed:`, pgErr.message || pgErr);
    }

    logWithTS(`[${requestId}] ✅ Webhook processing finished, ok.`);
    return res.status(200).send("✅ Webhook processed");
  } catch (err) {
    logWithTS("❌ verifyPayment controller error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
