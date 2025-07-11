import axios from "axios";
import Order from "../models/Order.js";
import { v4 as uuidv4 } from "uuid";

export const createCashfreeOrder = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || !amount) {
      return res.status(400).json({ message: "Missing orderId or amount" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Use env FRONTEND_URL or default to localhost
    const frontendBase = process.env.CLIENT_URL || "http://localhost:5173";
    const returnUrl = `${frontendBase}/order-confirmation?order_id=${orderId}`;

    const cfRes = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        order_id: `ORDER_${orderId}`,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: String(order.user),
          customer_email: "test@example.com",
          customer_phone: order.shippingAddress.phone,
        },
        order_meta: {
          return_url: returnUrl,
        },
      },
      {
        headers: {
          "x-api-version": "2023-08-01",
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
          "x-request-id": uuidv4(),
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Cashfree response:", cfRes.data);
    const payment_session_id = cfRes.data.payment_session_id;
    if (!payment_session_id) {
      console.error("No session ID returned:", cfRes.data);
      throw new Error("Missing session ID in response");
    }

    return res.status(200).json({ payment_session_id });
  } catch (error) {
    console.error("Cashfree order creation failed:", error.response?.data || error);
    res.status(500).json({ message: "Failed to create Cashfree order" });
  }
};
