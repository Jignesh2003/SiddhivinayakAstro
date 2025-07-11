import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { logTransactionToPostgres } from "../utils/logTransaction.js";
import Order from "../models/Order.js";

export const createCashfreeOrder = async (req, res) => {
  try {
    const { amount, user, shippingAddress, items } = req.body;

    if (!user || !amount || !shippingAddress || !items?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ message: "Cashfree credentials missing" });
    }

    // Unique payment ID (use this to track the session later in webhook)
    const customOrderId = `PREORDER_${user}_${Date.now()}`;

    const payload = {
      order_id: customOrderId,
      order_amount: Number(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: String(user),
        customer_email: shippingAddress.email || "test@example.com",
        customer_phone: shippingAddress.phone || "9999999999",
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/order-confirmation`,
        notify_url: process.env.CASHFREE_WEBHOOK_URL || "", // Webhook will handle DB insert
      },
      order_tags: {
        user,
        items: JSON.stringify(items), // Optional: You can extract and parse this in webhook
        shipping: JSON.stringify(shippingAddress),
      },
    };

    const headers = {
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "x-api-version": "2023-08-01",
      "x-request-id": uuidv4(),
      "Content-Type": "application/json",
    };

    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      payload,
      { headers }
    );

    const { payment_session_id, payment_link, checkout_url } = response.data;

    if (!payment_session_id) {
      return res.status(500).json({ message: "Missing session ID in Cashfree response" });
    }

    return res.status(200).json({
      payment_session_id,
      payment_link,
      checkout_url,
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
  const {
    mongoOrderId,
    orderId,
    cfOrderId,
    cfPaymentId,
    status,
    amount,
    currency,
    method,
    email,
    phone,
    signature,
  } = req.body;

  try {
    // 1. Optional: Verify signature (recommended for security)
    const computedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_WEBHOOK_SECRET)
      .update(
        `${orderId}${cfOrderId}${cfPaymentId}${amount}${currency}${status}`
      )
      .digest("hex");

    if (signature && computedSignature !== signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // 2. Log to PostgreSQL
    await logTransactionToPostgres({
      orderId,
      cfOrderId,
      cfPaymentId,
      status,
      amount,
      currency,
      method,
      signature,
      email,
      phone,
    });

    // 3. Update MongoDB Order if payment succeeded
    if (mongoOrderId && status === "SUCCESS") {
      await Order.findByIdAndUpdate(mongoOrderId, {
        paymentStatus: "Paid",
        paymentMethod: "online",
        orderStatus: "Pending", // optional
      });
    }

    return res.status(200).json({ message: "✅ Payment verified and order updated." });
  } catch (err) {
    console.error("❌ Payment Verify Error:", err);
    return res.status(500).json({ message: "Failed to verify payment" });
  }
};

