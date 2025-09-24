import axios from "axios";
import User from "../models/User.js"; // assuming you have a User model
import Order from "../models/Order.js"; // Make sure this is imported
import { v4 as uuidv4 } from "uuid";
import Product from "../models/Product.js";
import PostgresDb from "../config/postgresDb.js"
import { validateCouponForUser } from "../utils/couponServices.js";
import Coupon from "../models/Coupon.js";

export const createCashfreeOrder = async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();

  let customOrderId, user, amount, shippingAddress, items, userId, totalAmount, discount = 0;

  try {
    ({ shippingAddress, items } = req.body);
    userId = req.user?.id;

    if (!userId || !shippingAddress || !items?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Fetch user
    user = await User.findById(userId);
    if (!user || !user.email) {
      return res.status(400).json({ message: "User not found or missing email" });
    }

    // ✅ Validate phone
    if (!shippingAddress.phone || !/^\d{10}$/.test(shippingAddress.phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    customOrderId = `PREORDER_${userId}_${Date.now()}`;

    // ✅ Validate items & stock
    let subTotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`Product not found: ${item.product}`);

      const qty = Number(item.quantity ?? 1);
      if (product.sizeType !== "Quantity" && item.size) {
        const variant = product.stock.find((v) => v.size === item.size);
        if (!variant || variant.quantity < qty) {
          throw new Error(`Not enough stock for ${product.name} (${item.size})`);
        }
      } else {
        const availableQty = Array.isArray(product.stock)
          ? product.stock.reduce((sum, s) => sum + Number(s.quantity || 0), 0)
          : Number(product.stock?.quantity ?? 0);
        if (availableQty < qty) throw new Error(`Not enough stock for ${product.name}`);
      }

      subTotal += product.price * qty;
    }

    // ✅ Calculate GST & Delivery
    const gstAmount = Number(((subTotal * 18) / 118).toFixed(2));
    const deliveryCharges = subTotal > 499 ? 0 : 100;

    // ✅ Validate coupon from server
    let couponId = null;
    const couponCode = req.body.couponCode;
    if (couponCode) {
      const couponResult = await validateCouponForUser({
        code: couponCode,
        userId,
        cartValue: subTotal,
        cartItems: items.map(i => ({
          productId: i.product,
          categoryId: i.categoryId || null,
        })),
      });
      if (couponResult.valid) {
        discount =couponResult.discount;
        const couponDoc = await Coupon.findOne({ code: couponCode });
        if (couponDoc) {
          couponId = couponDoc._id;
        }
      } 
    }

    totalAmount = subTotal + deliveryCharges - discount;

    // ✅ Save order in MongoDB
    const newOrder = await Order.create(
      [
        {
          user: userId,
          items,
          totalAmount,
          gstAmount,
          deliveryCharges,
          discountAmount:discount,
          paymentMethod: "online",
          paymentStatus: "Initiated",
          orderStatus: "Pending",
          shippingAddress,
          customOrderId,
          coupon: couponId,
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
    return res.status(500).json({ message: err.message || "Failed to create order" });
  }

  // ✅ Log transaction in Postgres
  try {
    await PostgresDb("productorders_transactions").insert({
      order_id: customOrderId,
      cf_order_id: null,
      cf_payment_id: null,
      status: "INITIATED",
      amount: totalAmount,
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

  // ✅ Call Cashfree API
  try {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ message: "Cashfree credentials missing" });
    }

    const payload = {
      order_id: customOrderId,
      order_amount: totalAmount,
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

    const response = await axios.post(process.env.CASHFREE_CREATE_ORDER, payload, { headers });
    const { payment_session_id, payment_link, checkout_url } = response.data;

    if (!payment_session_id) {
      return res.status(500).json({ message: "Missing session ID in Cashfree response" });
    }

    return res.status(200).json({ payment_session_id, payment_link, checkout_url, customOrderId });
  } catch (err) {
    console.error("❌ Cashfree API order creation failed:", err.response?.data || err.message || err);
    return res.status(500).json({ message: "Failed to create Cashfree order", details: err.response?.data || err.message });
  }
};



export const checkPaymentStatus = async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) return res.status(400).json({ message: "Missing order_id" });

    const response = await axios.get(
      `${process.env.CASHFREE_CREATE_ORDER}/${order_id}`,
      {
        headers: {
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
          "x-api-version": "2023-08-01",
        },
      }
    );

    return res.json({ status: response.data.order_status });
  } catch (err) {
    console.error("Error checking payment status:", err.response?.data || err.message);
    return res.status(500).json({ message: "Failed to fetch payment status" });
  }
}

