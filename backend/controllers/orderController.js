import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js"
import {  updateOrderStatusSchema } from "../validation/orderValidation.js"
import Cart from "../models/cart.js"
// 🟢 Get single order by ID || FOr order Details
export const getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select("-items") // Exclude the items field
      .lean(); // Use .lean() for better performance

    if (!order) return res.status(404).json({ error: "Order not found" });

    console.log("Order fetched:", order); // Log the fetched order
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// ✅ Get All Orders (Admin & Seller)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").populate("items.product", "name price");

    res.status(200).json(orders); // ✅ Now returns user name, email, and shipping details
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// ✅ Update Order Status (Admin & Seller)
export const updateOrderStatus = async (req, res) => {
  try {
  
    const { orderId, status } = req.body;

    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = status;
    await order.save();

    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//user place an order 
export const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, totalAmount, paymentMethod, shippingAddress } = req.body;

    if (!items?.length) {
      return res.status(400).json({ message: "No items in the order." });
    }

    const orderItems = [];

    for (const item of items) {
      // 1. Find exactly the array entry whose quantity is ≥ the requested amount:
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product,
          "stock.quantity": { $gte: item.quantity }
        },
        {
          // 2. Decrement that matching array element’s quantity
          $inc: { "stock.$.quantity": -item.quantity }
        },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(400).json({
          message: `Not enough stock for product ${item.product}.`
        });
      }

      orderItems.push({
        product: updatedProduct._id,
        quantity: item.quantity
        // — don’t push `size` unless you’ve added it to your Order schema
      });
    }

    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
      orderStatus: "pending",
      shippingAddress
    });

    await order.save();

    // Clear the cart
    await Cart.findOneAndDelete({ user: userId });

    return res.status(201).json({ message: "Order placed", order });
  } catch (err) {
    console.error("Place Order Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//getiing user order placed list
export const getUserOrders = async (req, res) => {
  try {
    // ✅ Convert user ID to ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // ✅ Fetch orders for the user
    const orders = await Order.find({ user: userId }).populate("items.product");

    console.log("Orders fetched:", orders.length);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};