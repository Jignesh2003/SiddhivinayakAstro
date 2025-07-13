import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { logTransactionToPostgres } from "../utils/logTransaction.js";
import Order from "../models/Order.js";
import User from "../models/User.js"; // assuming you have a User model

export const createCashfreeOrder = async (req, res) => {
  try {
    const { amount, shippingAddress, items } = req.body;
    const userId = req.user?.id; // assumes auth middleware sets this

    if (!userId || !amount || !shippingAddress || !items?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user || !user.email) {
      return res.status(400).json({ message: "User not found or missing email" });
    }

    // Validate phone format
    if (!shippingAddress.phone || !/^\d{10}$/.test(shippingAddress.phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ message: "Cashfree credentials missing" });
    }

    const customOrderId = `PREORDER_${userId}_${Date.now()}`;

    const payload = {
      order_id: customOrderId,
      order_amount: Number(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: String(userId),
        customer_email: user.email,
        customer_phone: shippingAddress.phone,
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/order-confirmation?order_id=${customOrderId}&status={order_status}`,
        notify_url: process.env.CASHFREE_WEBHOOK_URL || "",
      },
      order_tags: {
        user: String(userId),
        item_count: items.length.toString(),
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

    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      payload,
      { headers }
    );
    console.log("PAYLOAD RESPONSE FROM CASHFREE CONTROLLER :", response);

    const { payment_session_id, payment_link, checkout_url } = response.data;

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
    const errorData = err.response?.data || err.message || err;
    console.error("❌ Cashfree order creation failed:", errorData);
    return res.status(500).json({
      message: "Failed to create Cashfree order",
      details: errorData,
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    // 1) Get raw body
    const raw = req.body.toString("utf8");

    // 2) Try parsing JSON to check if it's a test webhook
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      console.error("❌ Invalid JSON:", e);
      return res.status(400).send("Bad JSON");
    }

    // 3) TEMPORARY BYPASS for webhook test from Cashfree dashboard
    if (
      payload?.data?.test_object?.test_key === "test_value" &&
      payload?.type === "WEBHOOK"
    ) {
      console.log("🧪 Received test webhook from Cashfree. Bypassing signature check.");
      return res.status(200).send("Test webhook received");
    }

    // 4) Proceed with actual webhook signature verification
    const timestamp = req.headers["x-webhook-timestamp"];
    const incomingSig = req.headers["x-webhook-signature"];

    if (!timestamp || !incomingSig) {
      console.warn("⚠️ Missing signature headers");
      return res.status(400).send("Missing signature headers");
    }

    const signedPayload = `${timestamp}.${raw}`;
    const computedSig = crypto
      .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET)
      .update(signedPayload)
      .digest("base64");

    console.log("🔒 Raw body:", raw);
    console.log("📅 Timestamp:", timestamp);
    console.log("📩 Incoming signature:", incomingSig);
    console.log("📤 Computed signature:", computedSig);

    if (computedSig !== incomingSig) {
      console.warn("⚠️ Signature mismatch", { computedSig, incomingSig });
      return res.status(400).send("Invalid signature");
    }

    // 5) Parse body already done — use existing payload
    const { data } = payload;
    if (!data) {
      return res.status(400).send("Invalid payload structure");
    }

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

    // 6) Store transaction & update order
    await logTransactionToPostgres({
      orderId,
      cfOrderId,
      cfPaymentId,
      status,
      amount,
      currency,
      method: JSON.stringify(method),
      signature: incomingSig,
      email,
      phone,
    });

    if (mongoOrderId && status === "SUCCESS") {
      await Order.findByIdAndUpdate(mongoOrderId, {
        paymentStatus: "Paid",
        paymentMethod: "online",
        orderStatus: "Pending",
      });
    }

    return res.status(200).send("✅ Payment verified");
  } catch (err) {
    console.error("❌ verifyPayment error:", err);
    return res.status(500).send("Server error");
  }
};


export const checkPaymentStatus = async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) return res.status(400).json({ message: "Missing order_id" });

    const response = await axios.get(`https://sandbox.cashfree.com/pg/orders/${order_id}`, {
      headers: {
        "x-client-id": process.env.CASHFREE_CLIENT_ID,
        "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
        "x-api-version": "2023-08-01",
      },
    });

    return res.json({ status: response.data.order_status });
  } catch (err) {
    console.error("Error checking payment status:", err.response?.data || err.message);
    return res.status(500).json({ message: "Failed to fetch payment status" });
  }
}

