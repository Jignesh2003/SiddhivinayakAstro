import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { logTransactionToPostgres } from "../utils/logTransaction.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

// ────────────────────────────────────────────────────────────
// 🟡 Create Cashfree Order
// ────────────────────────────────────────────────────────────
export const createCashfreeOrder = async (req, res) => {
  try {
    const { amount, shippingAddress, items } = req.body;
    const userId = req.user?.id;

    if (!userId || !amount || !shippingAddress || !items?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user?.email) {
      return res.status(400).json({ message: "User not found or missing email" });
    }

    if (!/^\d{10}$/.test(shippingAddress.phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ message: "Cashfree credentials missing" });
    }

    const customOrderId = `PREORDER_${userId}_${Date.now()}`;

    await Order.create({
      _id: customOrderId,
      user: userId,
      items,
      shippingAddress,
      paymentMethod: "online",
      paymentStatus: "Pending",
      orderStatus: "Initiated",
      amount,
    });

    const payload = {
      order_id: customOrderId,
      order_amount: Number(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: userId,
        customer_email: user.email,
        customer_phone: shippingAddress.phone,
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/order-confirmation?order_id=${customOrderId}&status={order_status}`,
        notify_url: process.env.CASHFREE_WEBHOOK_URL,
      },
      order_tags: {
        user: userId,
        item_count: String(items.length),
        city: shippingAddress.city,
        pincode: shippingAddress.pincode,
      }
    };

    const headers = {
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "x-api-version": "2023-08-01",
      "x-request-id": uuidv4(),
      "Content-Type": "application/json",
    };

    if (process.env.NODE_ENV !== "production") {
      console.log("📦 Cashfree Payload:", JSON.stringify(payload, null, 2));
    }

    const { data } = await axios.post("https://sandbox.cashfree.com/pg/orders", payload, { headers });

    const { payment_session_id, payment_link, checkout_url } = data;
    if (!payment_session_id) {
      return res.status(500).json({ message: "Missing session ID in Cashfree response" });
    }

    return res.status(200).json({
      payment_session_id,
      payment_link,
      checkout_url,
      customOrderId,
    });

  } catch (err) {
    console.error("❌ Cashfree order creation failed:", err.response?.data || err);
    return res.status(500).json({
      message: "Failed to create Cashfree order",
      details: err.response?.data || err.message,
    });
  }
};

// ────────────────────────────────────────────────────────────
// ✅ Webhook: Verify + Process Payment
// ────────────────────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
  try {
    console.log("📩 Cashfree Webhook received");

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

    const computedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET)
      .update(`${timestamp}${rawBody}`, "utf8")
      .digest("base64");

    if (computedSignature !== incomingSignature) {
      console.warn("⚠️ Signature mismatch");
      return res.status(400).send("Invalid signature");
    }

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

    const cfOrderId =
      data?.payment?.cf_order_id ||
      data?.payment_gateway_details?.gateway_order_id ||
      null;

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
    console.log("↪️ CF Order ID:", cfOrderId);
    console.log("↪️ Payment Status:", paymentStatus);
    console.log("↪️ Timestamp:", eventTime);

    if (!cfPaymentId || !orderId) {
      console.warn("⚠️ Missing required IDs in webhook payload");
      return res.status(200).send("Skipped: Incomplete payment data");
    }

    // 🔁 Log to Postgres (idempotent logging)
    try {
      await logTransactionToPostgres({
        order_id: orderId,
        cf_order_id: cfOrderId,
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
      console.error("❌ Failed to log transaction to Postgres:", err?.message);
    }

    // ✅ Update MongoDB only if payment is SUCCESS
    if (
      eventType === "PAYMENT_SUCCESS_WEBHOOK" &&
      paymentStatus === "SUCCESS"
    ) {
      try {
        const updated = await Order.findByIdAndUpdate(orderId, {
          paymentStatus: "Paid",
          paymentMethod: "online",
          orderStatus: "Pending",
        });

        if (updated) {
          console.log(`✅ MongoDB order ${orderId} marked as Paid`);
        } else {
          console.warn(`⚠️ MongoDB order ${orderId} not found`);
        }
      } catch (err) {
        console.error(`❌ MongoDB update failed for ${orderId}:`, err.message);
      }
    } else {
      console.log("ℹ️ Payment not marked as SUCCESS, MongoDB not updated");
    }

    return res.status(200).send("✅ Webhook processed");

  } catch (err) {
    console.error("❌ verifyPayment controller error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
