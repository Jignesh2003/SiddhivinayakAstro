import crypto from "crypto";
import { logTransactionToPostgres } from "../utils/logTransaction.js";
import Order from "../models/Order.js";

export const verifyPayment = async (req, res) => {
  try {
    // 1) Ensure raw body is used
    const raw = req.body.toString("utf8");

    // 2) Get required headers (case-sensitive!)
    const timestamp = req.headers["x-webhook-timestamp"];
    const incomingSig = req.headers["x-webhook-signature"];

    if (!timestamp || !incomingSig) {
      console.warn("⚠️ Missing signature headers");
      return res.status(400).send("Missing signature headers");
    }

    // 3) Compute expected signature using HMAC-SHA256 and base64 encoding
    const signedPayload = `${timestamp}${raw}`;
    const computedSig = crypto
      .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET)
      .update(signedPayload, "utf8")
      .digest("base64");

    // 4) Log debug info for test mode
    console.log("🔒 Raw body:", raw);
    console.log("📅 Timestamp:", timestamp);
    console.log("📩 Incoming Signature:", incomingSig);
    console.log("🧮 Computed Signature:", computedSig);

    // 5) Verify signature match
    if (computedSig !== incomingSig) {
      console.warn("⚠️ Signature mismatch");
      return res.status(400).send("Invalid signature");
    }

    // 6) Parse verified JSON
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      console.error("❌ JSON parsing failed:", err);
      return res.status(400).send("Invalid JSON");
    }

    const { event, data } = payload;
    if (!event || !data) {
      return res.status(400).send("Invalid payload structure");
    }

    // 7) Destructure required fields safely
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

    // 8) Log transaction regardless of event
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


    // 9) Handle event-specific logic
    switch (event) {
      case "success payment":
        if (mongoOrderId && status === "SUCCESS") {
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
          await Order.findByIdAndUpdate(mongoOrderId, {
            paymentStatus: "Refunded",
            orderStatus: "Refunded",
          });
          console.log(`🔁 Refund processed for order ${mongoOrderId}`);
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



