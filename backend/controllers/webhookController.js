import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import PostgresDb from "../config/postgresDb.js";
import logTransactionToPostgres from "../utils/logTransaction.js";

export const verifyPayment = async (req, res) => {
  try {
    // --- 1. Signature and basic validation ---
    if (!Buffer.isBuffer(req.body)) {
      console.error("❌ Invalid webhook format: body is not raw Buffer");
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

    // --- 3. Handle Order Payments (existing functionality) ---
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

    // Only handle order updates if prefix is for product orders
    if (orderId.startsWith("PREORDER_") && mongoUpdate) {
      const mongoSession = await Order.startSession();
      try {
        await mongoSession.withTransaction(async () => {
          updatedOrder = await Order.findOneAndUpdate(
            { customOrderId: orderId },
            mongoUpdate,
            { session: mongoSession, new: true }
          );
          if (!updatedOrder) {
            throw new Error(`No order found with customOrderId=${orderId}`);
          }

          if (paymentStatus === "SUCCESS") {
            for (const item of updatedOrder.items) {
              const prodRes = await Product.findOneAndUpdate(
                { _id: item.product, "stock.quantity": { $gte: item.quantity } },
                { $inc: { "stock.$.quantity": -item.quantity } },
                { session: mongoSession, new: true }
              );
              if (!prodRes) {
                throw new Error(
                  `Insufficient stock or product not found for: ${item.product}`
                );
              }
            }
          }
        });
        mongoSession.endSession();
        console.log(
          `✅ Mongo order (${orderId}) status & stock processed: ${paymentStatus}`
        );
      } catch (err) {
        await mongoSession.abortTransaction();
        mongoSession.endSession();
        console.error("❌ MongoDB transaction failed:", err.message);
        return res.status(500).send("Order/stock update failed.");
      }
    }

    // --- 4. Handle Wallet Top-Ups (new) ---
    if (orderId.startsWith("WALLET_") && paymentStatus === "SUCCESS") {
      // Extract userId from orderId (e.g., WALLET_<userId>_<timestamp>)
      const parts = orderId.split("_");
      const userId = parts[1];
      // Start wallet update in a transaction
      try {
        await PostgresDb.transaction(async trx => {
          const wallet = await trx("wallet").where({ user_id: userId }).first();
          if (!wallet) {
            throw new Error(`Wallet not found for user ${userId}`);
          }

          // Prevent double-credit: check if this payment already processed
          const alreadyProcessed = await trx("wallet_transaction")
            .where({
              from_user_id: userId,
              type: "credit",
              status: "completed",
              description: orderId,
            })
            .first();
          if (alreadyProcessed) {
            console.log(`ℹ️ Duplicate wallet credit detected for ${orderId}`);
            return;
          }

          // Insert credit transaction
          await trx("wallet_transaction").insert({
            wallet_id: wallet.id,
            type: "credit",
            amount: paymentAmount,
            status: "completed",
            description: orderId,
            from_user_id: userId,
            to_user_id: userId,
          });

          // Update wallet balance
          await trx("wallet")
            .update({
              balance: Number(wallet.balance) + Number(paymentAmount),
              updated_at: trx.fn.now(),
            })
            .where({ id: wallet.id });

          console.log(
            `✅ Wallet for user ${userId} credited ₹${paymentAmount} via ${orderId}`
          );
        });
      } catch (err) {
        console.error("❌ Wallet credit error:", err.message || err);
        return res.status(500).send("Wallet credit failed.");
      }
    }

    // --- 5. Postgres Transaction: log payment (atomic for these) ---
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
      console.log("✅ Postgres: Payment event logged");
    } catch (pgErr) {
      console.error(
        "❌ Postgres logging failed after Mongo/Wallet commit:",
        pgErr.message || pgErr
      );
    }

    return res.status(200).send("✅ Webhook processed");
  } catch (err) {
    console.error("❌ verifyPayment controller error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
