// controllers/cashFreeController.js
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { logTransactionToPostgres } from "../utils/logTransaction.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

// ─── Create a new Cashfree order ────────────────────────────────
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

    const clientId     = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ message: "Cashfree credentials missing" });
    }

    // Build a unique order ID
    const customOrderId = `PREORDER_${userId}_${Date.now()}`;

    const payload = {
      order_id:       customOrderId,
      order_amount:   Number(amount),
      order_currency: "INR",
      customer_details: {
        customer_id:    userId,
        customer_email: user.email,
        customer_phone: shippingAddress.phone,
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/order-confirmation?order_id=${customOrderId}&status={order_status}`,
        notify_url: process.env.CASHFREE_WEBHOOK_URL,
      },
      order_tags: {
        user:       userId,
        item_count: String(items.length),
        city:       shippingAddress.city,
        pincode:    shippingAddress.pincode,
      },
    };

    const headers = {
      "x-client-id":     clientId,
      "x-client-secret": clientSecret,
      "x-api-version":   "2023-08-01",
      "x-request-id":    uuidv4(),
      "Content-Type":    "application/json",
    };

    if (process.env.NODE_ENV !== "production") {
      console.log("📦 Cashfree Payload:", JSON.stringify(payload, null, 2));
    }

    const { data: resp } = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      payload,
      { headers }
    );

    const { payment_session_id, payment_link, checkout_url } = resp;
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

// ─── Webhook Signature & Processing ─────────────────────────────
export const verifyPayment = async (req, res) => {
  try {
    console.log("📩 Webhook endpoint hit");

    // 1) Ensure raw body (Buffer)
    if (!Buffer.isBuffer(req.body)) {
      console.error("❌ req.body is not a raw Buffer");
      return res.status(400).send("Invalid body format");
    }
    const raw = req.body.toString("utf8");

    // 2) Signature headers (case‑sensitive)
    const timestamp   = req.headers["x-webhook-timestamp"];
    const incomingSig = req.headers["x-webhook-signature"];
    if (!timestamp || !incomingSig) {
      console.warn("⚠️ Missing signature headers");
      return res.status(400).send("Missing signature headers");
    }

    // 3) Compute HMAC‑SHA256 & Base64
    const signedPayload = `${timestamp}${raw}`;  // no dot
    const computedSig   = crypto
      .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET)
      .update(signedPayload, "utf8")
      .digest("base64");

    console.log("🔒 Raw body (first 200 chars):", raw.slice(0,200));
    console.log("📅 Timestamp:", timestamp);
    console.log("📩 Incoming Signature:", incomingSig);
    console.log("🧮 Computed Signature:", computedSig);

    // 4) Verify
    if (computedSig !== incomingSig) {
      console.warn("⚠️ Signature mismatch");
      return res.status(400).send("Invalid signature");
    }

    // 5) Parse as JSON
    let payload;
    try {
      payload = JSON.parse(raw);
      console.log("📤 Payload parsed successfully");
    } catch (e) {
      console.error("❌ JSON parse failed:", e);
      return res.status(400).send("Invalid JSON");
    }

    // 6) Extract event type & data object
    const eventType = payload.type;
    const data      = payload.data;
    if (!eventType || !data) {
      console.warn("⚠️ Invalid payload structure");
      return res.status(400).send("Invalid payload structure");
    }

    // 7) Drill down fields
    const {
      order: {
        order_id: orderId,
      } = {},
      payment: {
        cf_payment_id: cfPaymentId,
        cf_order_id:   cfOrderId,
        payment_status: status,
        payment_amount: amount,
        payment_currency: currency,
        payment_method:  method,
      } = {},
      customer_details: {
        customer_id:    mongoOrderId,
        customer_email: email,
        customer_phone: phone,
      } = {},
    } = data;

    console.log("🧾 Extracted Order:", mongoOrderId, "Status:", status);

    // 8) Idempotent Postgres insert (cf_payment_id unique)
    try {
      await logTransactionToPostgres({
        orderId,
        cfOrderId,
        cfPaymentId,
        status,
        amount,
        currency,
        method: JSON.stringify(method || {}),
        signature: incomingSig,
        email,
        phone,
      });
      console.log("✅ Logged to Postgres");
    } catch (pgErr) {
      console.error("❌ Postgres log failed:", pgErr);
    }

    // 9) Update Mongo only on success
    if (
      (eventType === "PAYMENT_SUCCESS_WEBHOOK" || eventType === "success payment") &&
      mongoOrderId &&
      status === "SUCCESS"
    ) {
      await Order.findByIdAndUpdate(mongoOrderId, {
        paymentStatus: "Paid",
        paymentMethod: "online",
        orderStatus:   "Pending",
      });
      console.log(`✅ MongoDB order ${mongoOrderId} marked Paid`);
    }

    return res.status(200).send("✅ Webhook processed");

  } catch (err) {
    console.error("❌ verifyPayment error:", err);
    return res.status(500).send("Server error");
  }
};


// ─── Check Payment Status ──────────────────────────────────────────────────────
// export const checkPaymentStatus = async (req, res) => {
//   try {
//     const { order_id } = req.query;
//     if (!order_id) {
//       return res.status(400).json({ message: "Missing order_id" });
//     }
//     const response = await axios.get(
//       `https://sandbox.cashfree.com/pg/orders/${order_id}`,
//       {
//         headers: {
//           "x-client-id":     process.env.CASHFREE_CLIENT_ID,
//           "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
//           "x-api-version":   "2023-08-01",
//         },
//       }
//     );
//     // Cashfree returns order_status like "PAID", "ACTIVE", etc.
//     return res.json({ status: response.data.order_status });
//   } catch (err) {
//     console.error("Error checking payment status:", err.response?.data || err);
//     return res.status(500).json({ message: "Failed to fetch payment status" });
//   }
// };
