import crypto from "crypto";
import { logTransactionToPostgres } from "../utils/logTransaction.js";
import Order from "../models/Order.js";

export const verifyPayment = async (req, res) => {
  try {
    console.log("📩 Webhook endpoint hit");

    // 1. Log body type for debug
    console.log("🔍 req.body typeof:", typeof req.body);
    console.log("🔍 Buffer.isBuffer(req.body):", Buffer.isBuffer(req.body));
    if (!Buffer.isBuffer(req.body)) {
      console.error("❌ req.body is not a buffer. Check middleware setup.");
      return res.status(400).send("Invalid body format");
    }

    // 2. Get raw body
    const raw = req.body.toString("utf8");
    console.log("📦 Raw body received:", raw.slice(0, 200), "...");

    // 3. Headers
    const timestamp = req.headers["x-webhook-timestamp"];
    const incomingSig = req.headers["x-webhook-signature"];
    console.log("📅 Timestamp:", timestamp);
    console.log("📩 Incoming Signature:", incomingSig);

    if (!timestamp || !incomingSig) {
      console.warn("⚠️ Missing signature headers");
      return res.status(400).send("Missing signature headers");
    }

    // 4. Compute signature
    const signedPayload = `${timestamp}${raw}`;
    const computedSig = crypto
      .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET)
      .update(signedPayload, "utf8")
      .digest("base64");
    console.log("🧮 Computed Signature:", computedSig);

    if (computedSig !== incomingSig) {
      console.warn("⚠️ Signature mismatch");
      return res.status(400).send("Invalid signature");
    }

    // 5. Parse verified JSON
    let payload;
    try {
      payload = JSON.parse(raw);
      console.log("📤 Payload parsed successfully");
    } catch (err) {
      console.error("❌ JSON parsing failed:", err);
      return res.status(400).send("Invalid JSON");
    }

    const { event, data } = payload;
    if (!event || !data) {
      console.warn("⚠️ Invalid payload structure");
      return res.status(400).send("Invalid payload structure");
    }

    // 6. Extract required fields
    const {
      order: { order_id: orderId } = {},
      payment: {
        cf_payment_id: cfPaymentId,
        cf_order_id: cfOrderId,
        payment_status: status,
        payment_amount: amount,
        payment_currency: currency,
        payment_method: method,
      } = {},
      customer_details: {
        customer_id: mongoOrderId,
        customer_email: email,
        customer_phone: phone,
      } = {},
    } = data;

    console.log("🧾 Extracted Order ID:", mongoOrderId);
    console.log("💰 Payment Status:", status);

    // 7. Log to Postgres
    try {
      console.log("📤 Attempting to log transaction to Postgres...");

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

      console.log("✅ Transaction logged to Postgres!");
    } catch (err) {
      console.error("❌ Failed to log transaction to Postgres:", err);
    }

    // 8. Process based on event type
    switch (event) {
      case "success payment":
        if (mongoOrderId && status === "SUCCESS") {
          console.log("💳 Updating MongoDB Order as Paid...");
          await Order.findByIdAndUpdate(mongoOrderId, {
            paymentStatus: "Paid",
            paymentMethod: "online",
            orderStatus: "Pending",
          });
          console.log(`✅ Order ${mongoOrderId} marked as paid.`);
        }
        break;

      case "failed payment":
      case "user dropped payment":
      case "abandoned checkout":
        console.log(`⚠️ Payment not completed: Event "${event}" for order ${mongoOrderId}`);
        break;

      case "refund":
      case "auto refund":
        if (mongoOrderId) {
          console.log(`🔁 Marking order ${mongoOrderId} as refunded`);
          await Order.findByIdAndUpdate(mongoOrderId, {
            paymentStatus: "Refunded",
            orderStatus: "Refunded",
          });
          console.log(`✅ Refund processed for order ${mongoOrderId}`);
        }
        break;

      default:
        console.log(`📩 Unhandled event: ${event}`);
    }

    return res.status(200).send("✅ Webhook received and processed");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).send("Server error");
  }
};
