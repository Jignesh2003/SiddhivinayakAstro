import crypto from "crypto";
import { logTransactionToPostgres } from "../utils/logTransaction.js";
import Order from "../models/Order.js";

export const verifyPayment = async (req, res) => {
  try {
    // 👀 Debug raw headers
    console.log("🔎 req.rawHeaders:", req.rawHeaders);

    console.log("📩 Cashfree Webhook received");
    console.log("📥 Incoming Headers:", req.headers);

    if (!Buffer.isBuffer(req.body)) {
      console.error("❌ Invalid webhook format: body is not raw Buffer");
      return res.status(400).send("Invalid webhook format");
    }

    const rawBody = req.body.toString("utf8");
    console.log("🔒 Webhook raw body (truncated):", rawBody.slice(0, 200), "...");

    const timestamp = req.headers["x-webhook-timestamp"];
    const incomingSignature = req.headers["x-webhook-signature"];

    if (!timestamp || !incomingSignature) {
      console.warn("⚠️ Missing signature headers");
      return res.status(400).send("Missing signature headers");
    }

    // Verify HMAC
    const computedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET)
      .update(`${timestamp}${rawBody}`, "utf8")
      .digest("base64");

    if (computedSignature !== incomingSignature) {
      console.warn("⚠️ Signature mismatch");
      return res.status(400).send("Invalid signature");
    }

    // Parse payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error("❌ Failed to parse JSON payload:", e);
      return res.status(400).send("Invalid JSON");
    }

    const eventType = payload?.type;
    const data = payload?.data;
    const eventTime = payload?.event_time;

    if (!eventType || !data || !eventTime) {
      console.error("❌ Malformed webhook payload");
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
      } = {},
      customer_details: {
        customer_email: customerEmail,
        customer_phone: customerPhone,
      } = {},
    } = data;

    console.log("📦 Webhook Summary:");
    console.log("↪️ Order ID:", orderId);
    console.log("↪️ CF Payment ID:", cfPaymentId);
    console.log("↪️ Payment Status:", paymentStatus);
    console.log("↪️ Timestamp:", eventTime);

    if (!cfPaymentId || !orderId) {
      console.warn("⚠️ Missing required IDs in webhook payload");
      return res.status(200).send("Skipped: Incomplete payment data");
    }

    // 🔁 Log to Postgres (idempotent)
    try {
      await logTransactionToPostgres({
        order_id:    orderId,
        cf_order_id: data?.payment?.cf_order_id || null,
        cf_payment_id: cfPaymentId,
        status:      paymentStatus,
        amount:      paymentAmount,
        currency:    paymentCurrency,
        payment_method: JSON.stringify(paymentMethod || {}),
        payment_time: eventTime,
        email:       customerEmail,
        phone:       customerPhone,
        signature:   incomingSignature,
      });
      console.log("✅ Transaction logged to Postgres");
    } catch (err) {
      console.error("❌ Failed to log transaction to Postgres:", err?.message);
    }

    // ✅ Update MongoDB only on SUCCESS
    if (eventType === "PAYMENT_SUCCESS_WEBHOOK" && paymentStatus === "SUCCESS") {
      try {
        const updated = await Order.findOneAndUpdate(
          { customOrderId: orderId },       // ← match on customOrderId
          {
            paymentStatus: "Paid",
            paymentMethod: "online",
            orderStatus:   "Pending",
          },
          { new: true }
        );

        if (updated) {
          console.log(`✅ MongoDB order ${updated._id} marked as Paid`);
        } else {
          console.warn(`⚠️ No order found with customOrderId=${orderId}`);
        }
      } catch (err) {
        console.error(`❌ MongoDB update failed for ${orderId}:`, err.message);
      }
    } else {
      console.log("ℹ️ Payment not SUCCESS, skipping Mongo update");
    }

    return res.status(200).send("✅ Webhook processed");
  } catch (err) {
    console.error("❌ verifyPayment controller error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
