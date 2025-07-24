import crypto from "crypto";
import { logTransactionToPostgres } from "../utils/logTransaction.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js"; // ← Make sure this line is present

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

    // --- 3. MongoDB Transaction: order update + stock (atomic for these) ---
    let updatedOrder = null;
    // Only operate if order status is mapped
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

    if (mongoUpdate) {
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

          // Deduct stock only if payment succeeded
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
    } else {
      // No matching status mapping; just acknowledge
      console.log(
        `ℹ️ Payment status '${paymentStatus}' not mapped to MongoDB update`
      );
    }

    // --- 4. Postgres Transaction: log payment (atomic for these) ---
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
      // Mongo may already be committed; log for admin
      console.error(
        "❌ Postgres logging failed after Mongo commit:",
        pgErr.message || pgErr
      );
      // Optionally: flag for reconciliation or retry
    }

    // --- 5. Webhook done ---
    return res.status(200).send("✅ Webhook processed");
  } catch (err) {
    console.error("❌ verifyPayment controller error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
