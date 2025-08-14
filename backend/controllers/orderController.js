import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js"
import Cart from "../models/cart.js"
import PDFDocument from "pdfkit";


// 🟢 Get single order by ID || FOr order Details
export const getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name images price") // get product details
      .lean();

    if (!order) return res.status(404).json({ error: "Order not found" });

    console.log("Order fetched:", order);
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

export const getOrderInvoiceData = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(orderId);

    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("user", "name email");

    if (!order) {
      console.log("Order not found");
      return res.status(404).send("Order not found");
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${orderId}.pdf`,
    });

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    // Helper function to draw horizontal lines
    const drawLine = (y) => {
      doc
        .strokeColor("#eeeeee")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(545, y)
        .stroke();
    };

    // === BRANDING & HEADER ===
    doc
      .fillColor("#333333")
      .fontSize(20)
      .text("SV ASTRO PRIVATE LIMITED", 180, 50, { align: "left" })
      // .fontSize(10)
      // .text("GSTIN: 22AAAAA0000A1Z5", 180, 75)
      .text("www.siddhivinayakastroworld.com", 180, 90)
      .moveDown();

    drawLine(120);

    // === INVOICE TITLE & DETAILS ===
    doc.fontSize(18).fillColor("#111111").text("TAX INVOICE", 50, 130);

    const startY = 160;
    doc
      .fontSize(10)
      .fillColor("#555555")
      .text(`Invoice ID: ${order._id}`, 50, startY)
      .text(
        `Order Date: ${new Date(order.createdAt).toLocaleDateString()}`,
        50,
        startY + 15
      )
      .text(`Payment Method: ${order.paymentMethod}`, 50, startY + 30)
      .text(`Payment Status: ${order.paymentStatus}`, 50, startY + 45)
      .text(`Order Status: ${order.orderStatus}`, 50, startY + 60);

    // === BILL TO (CUSTOMER) ===
    const billToX = 350;
    doc
      .fontSize(10)
      .fillColor("#555555")
      .text("Bill To:", billToX, 130)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text(order.shippingAddress.name, billToX, 145)
      .font("Helvetica")
      .text(`Phone: ${order.shippingAddress.phone}`, billToX, 160)
      .text(order.shippingAddress.address, billToX, 175)
      .text(
        `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
        billToX,
        190
      );

    if (order.shippingAddress.landmark) {
      doc.text(`Landmark: ${order.shippingAddress.landmark}`, billToX, 205);
    }

    drawLine(230);

    // === TABLE HEADER ===
    const tableTop = 250;
    const itemX = 50;
    const qtyX = 60;
    const prodX = 100;
    const priceX = 350;
    const totalX = 450;

    doc
      .fontSize(12)
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .text("Qty", qtyX, tableTop)
      .text("Product Name", prodX, tableTop)
      .text("Price", priceX, tableTop, { width: 90, align: "right" })
      .text("Total", totalX, tableTop, { align: "right" });

    drawLine(tableTop + 18);

    // === TABLE ROWS ===
    let y = tableTop + 25;
    doc.font("Helvetica").fontSize(11).fillColor("#333333");

    order.items.forEach((item) => {
      const itemTotal = item.quantity * (item.product.price || 0);

      doc
        .text(item.quantity, qtyX, y)
        .text(item.product.name, prodX, y)
        .text(`RS ${item.product.price.toFixed(2)}`, priceX, y, {
          width: 90,
          align: "right",
        })
        .text(`RS ${itemTotal.toFixed(2)}`, totalX, y, { align: "right" });

      y += 20;
      drawLine(y - 5);
    });

    // === SUMMARY BOX ===
    y += 15;
    drawLine(y);

    const subTotal =
      order.totalAmount - (order.gstAmount || 0) - (order.deliveryCharges || 0);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Summary", 50, y + 10);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Subtotal:`, 350, y + 30)
      .text(`RS ${subTotal.toFixed(2)}`, 460, y + 30, { align: "right" })
      .text(`GST:`, 350, y + 50)
      .text(`RS ${(order.gstAmount || 0).toFixed(2)}`, 460, y + 50, {
        align: "right",
      })
      .text(`Delivery Charges:`, 350, y + 70)
      .text(`RS ${(order.deliveryCharges || 0).toFixed(2)}`, 460, y + 70, {
        align: "right",
      })
      .font("Helvetica-Bold")
      .text(`Grand Total:`, 350, y + 90)
      .text(`RS ${order.totalAmount.toFixed(2)}`, 460, y + 90, {
        align: "right",
      });

    // === FOOTER ===
    doc.fontSize(10).font("Helvetica").fillColor("#666666");
    doc.text(
      "Thank you for your purchase! For any queries, contact siddhivinayakastroworld@gmail.com",
      50,
      780,
      { align: "center", width: 500 }
    );
    doc.end();    
  } catch (error) {
    console.error("Invoice PDF generation failed:", error);
    res.status(500).send("Server error");
  }
}
