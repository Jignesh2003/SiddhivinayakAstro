import axios from "axios";
import User from "../models/User.js"; // assuming you have a User model
import Order from "../models/Order.js"; // Make sure this is imported
import { v4 as uuidv4 } from "uuid";
import Product from "../models/Product.js";
import PostgresDb from "../config/postgresDb.js"

export const createCashfreeOrder = async (req, res) => {
  // === MONGO SESSION: CREATE ORDER ===
  const session = await Order.startSession();
  session.startTransaction();
  let customOrderId, user, amount, shippingAddress, items, userId;

  try {
    ({ amount, shippingAddress, items } = req.body);
    userId = req.user?.id;

    if (!userId || !amount || !shippingAddress || !items?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    user = await User.findById(userId);
    if (!user || !user.email) {
      return res
        .status(400)
        .json({ message: "User not found or missing email" });
    }

    // Validate phone format
    if (!shippingAddress.phone || !/^\d{10}$/.test(shippingAddress.phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    customOrderId = `PREORDER_${userId}_${Date.now()}`;

    // Step 1: Validate items, DO NOT update stock here
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ message: `Product not found: ${item.product}` });
      }
      const stockEntry = product.stock?.find(
        (s) => s.quantity >= item.quantity
      );
      if (!stockEntry) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ message: `Not enough stock for product ${item.product}` });
      }
    }

    // === Step 2: Calculate GST and Delivery Charges ===
    // GST is included in amount (18% inclusive) -> extract GST portion
    console.log(amount);
    
    const gstAmount = Number(((amount * 0.18) ).toFixed(2));

    // Delivery: Free if >499 else ₹100
    const deliveryCharges = amount > 499 ? 0 : 100;
    // === Step 3: Save the pending order in Mongo ===
    const newOrder = await Order.create(
      [
        {
          user: userId,
          items,
          totalAmount: (amount + deliveryCharges ), // total amount including GST 
          gstAmount,
          deliveryCharges,
          paymentMethod: "online",
          paymentStatus: "Initiated",
          orderStatus: "Pending",
          shippingAddress,
          customOrderId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Mongo order creation failed:", err);
    return res.status(500).json({
      message: "Failed to create order in MongoDB",
      details: err.message || err,
    });
  }

  // === POSTGRES: CREATE INITIATED PAYMENT RECORD ===
  try {
    await PostgresDb("productorders_transactions").insert({
      order_id: customOrderId,
      cf_order_id: null,
      cf_payment_id: null,
      status: "INITIATED",
      amount: amount, //  store gst and dilivery seprate but gst will be includent in amount 
      currency: "INR",
      payment_method: null,
      payment_time: new Date(),
      email: user.email,
      phone: shippingAddress.phone,
      signature: null,
    });
  } catch (pgErr) {
    console.error("❌ Failed to log initiated payment in Postgres:", pgErr);
  }

  // === CALL CASHFREE API ===
  try {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ message: "Cashfree credentials missing" });
    }
    const gstAmount = Number(((amount * 0.18)).toFixed(2));

    const payload = {
      order_id: customOrderId,
      order_amount: Number(amount + (amount > 499 ? 0 : 100)), // total to pay in prod
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
      },
    };

    if (process.env.NODE_ENV !== "production") {
      console.log("📦 Cashfree Payload:", JSON.stringify(payload, null, 2));
    }

    const headers = {
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "x-api-version": "2023-08-01",
      "x-request-id": uuidv4(),
      "Content-Type": "application/json",
    };

    const response = await axios.post(
      "https://api.cashfree.com/pg/orders",
      payload,
      { headers }
    );

    const { payment_session_id, payment_link, checkout_url } = response.data;
    if (!payment_session_id) {
      return res
        .status(500)
        .json({ message: "Missing session ID in Cashfree response" });
    }

    return res.status(200).json({
      payment_session_id,
      payment_link,
      checkout_url,
      customOrderId,
    });
  } catch (err) {
    console.log(
      "❌ Cashfree API order creation failed:",
      err
    );
    return res.status(500).json({
      message: "Failed to create Cashfree order",
      details: err.response?.data || err.message || err,
    });
  }
};



export const checkPaymentStatus = async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) return res.status(400).json({ message: "Missing order_id" });

    const response = await axios.get(`https://api.cashfree.com/pg/orders/${order_id}`, {
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

