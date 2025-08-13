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

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "No items in the order." });
    }

    const orderItems = [];
    for (const item of items) {
      // Convert and validate quantity
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ message: `Invalid quantity for product ${item.product}` });
      }

      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product,
          "stock.quantity": { $gte: quantity }
        },
        {
          $inc: { "stock.$.quantity": -quantity }
        },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(400).json({ message: `Not enough stock for product ${item.product}.` });
      }

      orderItems.push({
        product: updatedProduct._id,
        quantity, // always number
        // include size if you support sizes: size: item.size
      });
    }

    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === "cod" ? "Pending" : "Initiated",
      orderStatus: "Pending",
      shippingAddress,
    });

    await order.save();

    // Clear the cart
    await Cart.findOneAndDelete({ user: userId });

    return res.status(201).json({
      message: "Order placed",
      order,
      paymentStatus: order.paymentStatus,
    });
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

export const checkCodOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.query;

    if (!order_id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findById(order_id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ status: order.orderStatus });
  } catch (err) {
    console.error("COD Status Check Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrderInvoiceData = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user")
      .populate("product.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure numeric values have safe defaults
    const totalAmount =
      typeof order.totalAmount === "number" ? order.totalAmount : 0;
    const gstAmount = typeof order.gstAmount === "number" ? order.gstAmount : 0;
    const deliveryCharges =
      typeof order.deliveryCharges === "number" ? order.deliveryCharges : 0;

    // Set PDF headers before streaming
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${orderId}.pdf`
    );

    const doc = new PDFDocument({ margin: 50 });

    // Handle PDF generation errors
    doc.on("error", (err) => {
      console.error("PDF generation error:", err);
      if (!res.headersSent) {
        res.status(500).end("Error generating PDF");
      }
    });

    // Pipe PDF to the HTTP response
    doc.pipe(res);

    // ======== PDF CONTENT ========

    // Header
    doc.fontSize(22).text("INVOICE", { align: "center" }).moveDown();

    // Order info
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`)
      .moveDown();

    // Customer info
    doc.text(`Customer: ${order.user?.name || "N/A"}`);
    doc.text(`Email: ${order.user?.email || "N/A"}`);
    doc.text(`Phone: ${order.shippingAddress?.phone || "N/A"}`).moveDown();

    // Shipping address
    doc.fontSize(14).text("Shipping Address:", { underline: true });
    doc
      .fontSize(12)
      .text(
        `${order.shippingAddress?.name || ""}, ${
          order.shippingAddress?.address || ""
        }, ${order.shippingAddress?.city || ""}, ${
          order.shippingAddress?.state || ""
        } - ${order.shippingAddress?.pincode || ""}`
      );
    doc
      .text(`Landmark: ${order.shippingAddress?.landmark || "N/A"}`)
      .moveDown();

    // Product list
    doc.fontSize(14).text("Products:", { underline: true });
    order.product.forEach((item, index) => {
      const p = item.product;
      const price = typeof p.price === "number" ? p.price : 0;
      doc
        .fontSize(12)
        .text(
          `${index + 1}. ${p.name} (${item.size}) x ${item.quantity} — Rs ${(
            price * item.quantity
          ).toFixed(2)}`
        );
    });

    doc.moveDown();
    console.log(gstAmount);

    // Totals (with corrected GST and safe defaults)
    doc
      .fontSize(12)
      .text(`Subtotal: Rs ${(totalAmount - gstAmount).toFixed(2)}`);
    doc.text(`GST: Rs ${gstAmount.toFixed(2)}`);
    if (deliveryCharges > 0) {
      doc.text(`Delivery: Rs ${deliveryCharges.toFixed(2)}`);
    }
    doc.font("Helvetica-Bold").text(`Total: Rs ${totalAmount.toFixed(2)}`);
    doc.font("Helvetica");

    // Payment info
    doc
      .moveDown()
      .text(
        `Payment: ${order.paymentMethod || "N/A"} — ${
          order.paymentStatus || "N/A"
        }`
      );

    // Footer note
    doc
      .moveDown(2)
      .text("Thank you for shopping with us!", { align: "center" });

    // ======== END CONTENT ========

    // Finalize PDF and close HTTP response
    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};