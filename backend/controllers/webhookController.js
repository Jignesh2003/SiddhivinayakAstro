import crypto from "crypto";
import { logTransactionToPostgres } from "../utils/logTransaction.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js"; // ← Make sure this line is present

export const verifyPayment = async (req, res) => {
  try {
    console.log("📩 Cashfree Webhook received");
    console.log("📥 Incoming Headers:", req.headers);

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

    // Verify HMAC Signature
    const computedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET)
      .update(`${timestamp}${rawBody}`, "utf8")
      .digest("base64");

    if (computedSignature !== incomingSignature) {
      return res.status(400).send("Invalid signature");
    }

    // Parse Webhook JSON
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
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

    // Log to Postgres
    try {
      await logTransactionToPostgres({
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
      });
      console.log("✅ Transaction logged to Postgres");
    } catch (err) {
      console.error("❌ Failed to log transaction to Postgres:", err.message);
    }

    // Update MongoDB Order based on status
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

    let updated = null;

    if (mongoUpdate) {
      try {
        updated = await Order.findOneAndUpdate(
          { customOrderId: orderId },
          mongoUpdate,
          { new: true }
        );

        if (updated) {
          console.log(`✅ MongoDB order ${updated._id} marked as ${paymentStatus}`);
        } else {
          console.warn(`⚠️ No order found with customOrderId=${orderId}`);
        }
      } catch (err) {
        console.error(`❌ MongoDB update failed for ${orderId}:`, err.message);
      }
    } else {
      console.log(`ℹ️ Payment status '${paymentStatus}' not mapped to MongoDB update`);
    }

    // --- DEDUCT STOCK IF PAYMENT SUCCESS ---
    if (paymentStatus === "SUCCESS" && updated) {
      try {
        for (const item of updated.items) {
          // If you have a specific stock structure, adjust accordingly:
          const incRes = await Product.findOneAndUpdate(
            {
              _id: item.product,
              "stock.quantity": { $gte: item.quantity }
            },
            {
              $inc: { "stock.$.quantity": -item.quantity }
            },
            { new: true }
          );

          if (!incRes) {
            console.warn(
              `⚠️ Insufficient stock for product ${item.product}; not deducted`
            );
            // optional: handle partial stock deductions or rollback
          } else {
            console.log(
              `✅ Deducted ${item.quantity} from stock for product ${item.product}`
            );
          }
        }
      } catch (stockErr) {
        console.error("❌ Error deducting stock in verifyPayment:", stockErr);
        // You can choose to alert, retry, or mark order for manual review here
      }
    }

    return res.status(200).send("✅ Webhook processed");
  } catch (err) {
    console.error("❌ verifyPayment controller error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
