import axios from "axios";
import Order from "../models/Order.js";

export const createCashfreeOrder = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: "Missing orderId or amount" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        order_id: `ORDER_${orderId}`,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: String(order.user),
          customer_email: "test@example.com", // Optional: Replace if you store email
          customer_phone: order.shippingAddress.phone,
        },
        order_meta: {
          return_url: "https://www.siddhivinayakastroworld.comm/order-confirmation?order_id={order_id}",
        },
      },
      {
        headers: {
          "x-api-version": "2022-09-01",
          "Content-Type": "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        },
      }
    );

    const { payment_session_id } = response.data;
    return res.status(200).json({ payment_session_id });
  } catch (error) {
    console.error("Cashfree order creation failed:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to create Cashfree order" });
  }
};
