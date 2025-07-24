import axios from "axios";
import User from "../models/User.js"; // assuming you have a User model
import Order from "../models/Order.js"; // Make sure this is imported
import { v4 as uuidv4 } from "uuid";
import Product from "../models/Product.js";

export const createCashfreeOrder = async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();
  try {
    const { amount, shippingAddress, items } = req.body;
    const userId = req.user?.id;

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

    // Step 1: Validate items, DO NOT update stock here!
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Product not found: ${item.product}` });
      }
      // Optionally check stock >= quantity, strictly for early UI feedback
      const stockEntry = product.stock?.find(s => s.quantity >= item.quantity);
      if (!stockEntry) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Not enough stock for product ${item.product}` });
      }
    }

    // Step 2: Save the pending order in Mongo, but do not touch stock
    const newOrder = await Order.create([{
      user: userId,
      items,
      totalAmount: amount,
      paymentMethod: "online",
      paymentStatus: "Initiated",
      orderStatus: "Pending",
      shippingAddress,
      customOrderId,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Step 3: Prepare and call Cashfree API
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
      },
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
    await session.abortTransaction();
    session.endSession();
    const errorData = err.response?.data || err.message || err;
    console.error("❌ Cashfree order creation failed:", errorData);
    return res.status(500).json({
      message: "Failed to create Cashfree order",
      details: errorData,
    });
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

