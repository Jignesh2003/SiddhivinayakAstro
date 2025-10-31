import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/cart.js";
import PDFDocument from "pdfkit";

// 🟢 Get single order by ID
export const getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name images price hasVariants variants") // 🆕 Added variants
      .lean();

    if (!order) return res.status(404).json({ error: "Order not found" });

    console.log("✅ Order fetched:", order._id);
    res.json(order);
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// ✅ Get All Orders (Admin & Seller)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "firstName lastName email phone") // 🆕 Added firstName, lastName
      .populate("items.product", "name price hasVariants variants"); // 🆕 Added variants

    console.log(`✅ Fetched ${orders.length} orders (admin)`);
    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// ✅ Update Order Status (Admin & Seller)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const validStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "On-way",
      "Out-for-delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = status;
    await order.save();

    console.log(`✅ Order ${orderId} status updated to ${status}`);
    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    console.error("❌ Update Order Status Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🆕 Place Order with Variant Support
export const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      items,
      totalAmount,
      gstAmount,
      deliveryCharges,
      paymentMethod,
      shippingAddress,
      coupon,
      discountAmount,
    } = req.body;

    console.log("📦 Placing order for user:", userId);

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "No items in the order." });
    }

    const orderItems = [];

    // Process each item and update stock
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({
          message: `Invalid quantity for product ${item.product}`,
        });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          message: `Product ${item.product} not found`,
        });
      }

      const orderItem = {
        product: product._id,
        quantity,
        price: item.price,
      };

      // 🆕 Handle Variant Products
      if (item.variantId && product.hasVariants) {
        const variant = product.variants.id(item.variantId);

        if (!variant) {
          return res.status(404).json({
            message: `Variant not found for product ${product.name}`,
          });
        }

        // Check variant stock
        if (variant.stock < quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name} (${variant.variantName}). Available: ${variant.stock}`,
          });
        }

        // Update variant stock
        variant.stock -= quantity;
        await product.save();

        // Add variant info to order item
        orderItem.variantId = item.variantId;
        orderItem.variant = {
          variantName: variant.variantName,
          gram: variant.gram,
          price: variant.price,
          sku: variant.sku,
        };

        console.log(
          `✅ Reduced ${quantity} stock from variant ${variant.variantName}. Remaining: ${variant.stock}`
        );
      }
      // Handle Legacy Products with Size
      else if (item.size) {
        const stockItem = product.stock.find((s) => s.size === item.size);

        if (!stockItem) {
          return res.status(404).json({
            message: `Size ${item.size} not found for product ${product.name}`,
          });
        }

        if (stockItem.quantity < quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name} (Size: ${item.size}). Available: ${stockItem.quantity}`,
          });
        }

        // Update legacy stock
        stockItem.quantity -= quantity;
        await product.save();

        orderItem.size = item.size;

        console.log(
          `✅ Reduced ${quantity} stock from size ${item.size}. Remaining: ${stockItem.quantity}`
        );
      }
      // Handle Simple Products (no variant, no size)
      else {
        const totalStock = product.stock.reduce(
          (sum, s) => sum + s.quantity,
          0
        );

        if (totalStock < quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name}. Available: ${totalStock}`,
          });
        }

        // Reduce from first available stock
        let remaining = quantity;
        for (const stockItem of product.stock) {
          if (remaining <= 0) break;
          const toReduce = Math.min(stockItem.quantity, remaining);
          stockItem.quantity -= toReduce;
          remaining -= toReduce;
        }

        await product.save();

        console.log(`✅ Reduced ${quantity} stock from ${product.name}`);
      }

      orderItems.push(orderItem);
    }

    // Create order
    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
      gstAmount: gstAmount || 0,
      deliveryCharges: deliveryCharges || 0,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === "cod" ? "Pending" : "Initiated",
      orderStatus: "Pending",
      shippingAddress,
      coupon: coupon || null,
      discountAmount: discountAmount || 0,
    });

    await order.save();

    // Clear cart
    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

    console.log("✅ Order placed successfully:", order._id);

    return res.status(201).json({
      message: "Order placed successfully",
      order,
      paymentStatus: order.paymentStatus,
    });
  } catch (err) {
    console.error("❌ Place Order Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Getting user order list
export const getUserOrders = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const orders = await Order.find({ user: userId })
      .populate("items.product")
      .sort({ createdAt: -1 });

    console.log(`✅ Fetched ${orders.length} orders for user ${userId}`);
    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Get Orders Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Check COD order status
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
    console.error("❌ COD Status Check Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 🆕 Generate Invoice PDF with Variant Support
export const getOrderInvoiceData = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("📄 Generating invoice for order:", orderId);

    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("user", "firstName lastName email phone") // 🆕 Updated
      .populate("coupon");

    if (!order) {
      console.log("❌ Order not found");
      return res.status(404).send("Order not found");
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${orderId}.pdf`,
    });

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    // Helper function to draw horizontal lines
    const drawLine = (y, color = "#eeeeee", width = 1) => {
      doc
        .strokeColor(color)
        .lineWidth(width)
        .moveTo(50, y)
        .lineTo(545, y)
        .stroke();
    };

    // === BRANDING & HEADER ===
    doc
      .fillColor("#1a1a1a")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("SV ASTRO PRIVATE LIMITED", 50, 50)
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#555555")
      .text("www.siddhivinayakastroworld.com", 50, 78)
      .text("Email: siddhivinayakastroworld@gmail.com", 50, 90);

    drawLine(115, "#cccccc", 1.5);

    // === INVOICE TITLE & DETAILS ===
    doc
      .fontSize(20)
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .text("TAX INVOICE", 50, 130);

    const startY = 165;
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text("Invoice Number:", 50, startY, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${order._id}`, { continued: false })
      .font("Helvetica")
      .text("Invoice Date:", 50, startY + 15, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${new Date(order.createdAt).toLocaleDateString("en-IN")}`)
      .font("Helvetica")
      .text("Payment Method:", 50, startY + 30, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${order.paymentMethod.toUpperCase()}`)
      .font("Helvetica")
      .text("Payment Status:", 50, startY + 45, { continued: true })
      .font("Helvetica-Bold")
      .fillColor(
        order.paymentStatus === "Paid"
          ? "#27ae60"
          : order.paymentStatus === "Initiated"
            ? "#f39c12"
            : "#e74c3c"
      )
      .text(` ${order.paymentStatus}`);

    // === BILL TO (CUSTOMER) ===
    const billToX = 320;
    const billToWidth = 225;
    const beforeAddressY = 130;

    // 🆕 Updated customer name display
    const customerName =
      order.user?.firstName && order.user?.lastName
        ? `${order.user.firstName} ${order.user.lastName}`
        : order.shippingAddress?.name || "N/A";

    doc
      .fontSize(11)
      .fillColor("#555555")
      .font("Helvetica-Bold")
      .text("BILL TO", billToX, beforeAddressY, { width: billToWidth })
      .fontSize(10)
      .fillColor("#000000")
      .text(customerName, billToX, beforeAddressY + 18, {
        width: billToWidth,
      })
      .font("Helvetica")
      .fillColor("#333333")
      .fontSize(9)
      .text(`Phone: ${order.shippingAddress.phone || "N/A"}`, billToX, doc.y + 2, {
        width: billToWidth,
      })
      .text(order.shippingAddress.address || "", billToX, doc.y + 2, {
        width: billToWidth,
      })
      .text(
        `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
        billToX,
        doc.y + 2,
        { width: billToWidth }
      );

    if (order.shippingAddress.landmark) {
      doc.text(`Landmark: ${order.shippingAddress.landmark}`, billToX, doc.y + 2, {
        width: billToWidth,
      });
    }

    const afterDetailsY = Math.max(doc.y, startY + 70);
    drawLine(afterDetailsY + 15, "#cccccc", 1.5);

    // === TABLE HEADER ===
    const tableTop = afterDetailsY + 30;
    const slX = 55;
    const qtyX = 90;
    const prodX = 130;
    const priceX = 360;
    const amountX = 440;

    doc.fontSize(10).fillColor("#ffffff").font("Helvetica-Bold");

    doc.rect(50, tableTop - 5, 495, 20).fill("#2c3e50");

    doc
      .fillColor("#ffffff")
      .text("S.No", slX, tableTop)
      .text("Qty", qtyX, tableTop)
      .text("Product Details", prodX, tableTop)
      .text("Price", priceX, tableTop, { width: 70, align: "right" })
      .text("Amount", amountX, tableTop, { width: 50, align: "right" });

    // === TABLE ROWS WITH VARIANT SUPPORT ===
    let y = tableTop + 25;
    doc.font("Helvetica").fontSize(9).fillColor("#333333");

    let itemsSubtotal = 0;

    order.items.forEach((item, index) => {
      // 🆕 Get price from variant or product
      const itemPrice = item.variant?.price || item.product?.price || item.price || 0;
      const itemTotal = item.quantity * itemPrice;
      itemsSubtotal += itemTotal;

      const rowStartY = y;

      // Alternate row background
      if (index % 2 === 0) {
        doc.rect(50, y - 3, 495, 22).fillAndStroke("#f9f9f9", "#f9f9f9");
      }

      // 🆕 Product name with variant info
      let productName = item.product?.name || "Unknown Product";
      if (item.variant?.variantName) {
        productName += ` (${item.variant.variantName})`;
      } else if (item.size) {
        productName += ` (Size: ${item.size})`;
      }

      doc
        .fillColor("#333333")
        .text(index + 1, slX, y)
        .text(item.quantity, qtyX, y)
        .text(productName, prodX, y, { width: 220 })
        .text(`₹${itemPrice.toFixed(2)}`, priceX, rowStartY, {
          width: 70,
          align: "right",
        })
        .text(`₹${itemTotal.toFixed(2)}`, amountX, rowStartY, {
          width: 50,
          align: "right",
        });

      // 🆕 Add SKU if variant has it
      if (item.variant?.sku) {
        doc
          .fontSize(7)
          .fillColor("#888888")
          .text(`SKU: ${item.variant.sku}`, prodX, doc.y, { width: 220 });
      }

      y = Math.max(doc.y, y) + 10;
    });

    drawLine(y, "#cccccc", 1);

    // === CALCULATION SUMMARY ===
    y += 20;

    const summaryX = 320;
    const summaryValueX = 460;
    const summaryValueWidth = 85;

    const discountAmount = order.discountAmount || 0;
    const gstAmount = order.gstAmount || 0;
    const deliveryCharges = order.deliveryCharges || 0;
    const grandTotal = order.totalAmount;
    const subtotalBeforeGST = itemsSubtotal - discountAmount;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#2c3e50")
      .text("INVOICE SUMMARY", 50, y);

    y += 20;

    // Subtotal
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#333333")
      .text("Subtotal (Items):", summaryX, y)
      .font("Helvetica-Bold")
      .text(`₹${itemsSubtotal.toFixed(2)}`, summaryValueX, y, {
        width: summaryValueWidth,
        align: "right",
      });

    // Discount
    y += 15;
    const couponCode = order.coupon?.code ? ` (${order.coupon.code})` : "";
    const discountColor = discountAmount > 0 ? "#27ae60" : "#333333";
    doc
      .font("Helvetica")
      .fillColor(discountColor)
      .text(`Discount${couponCode}:`, summaryX, y)
      .font("Helvetica-Bold")
      .text(`- ₹${discountAmount.toFixed(2)}`, summaryValueX, y, {
        width: summaryValueWidth,
        align: "right",
      });

    // Subtotal after discount
    y += 15;
    doc
      .fillColor("#333333")
      .font("Helvetica")
      .text("Subtotal (After Discount):", summaryX, y)
      .font("Helvetica-Bold")
      .text(`₹${subtotalBeforeGST.toFixed(2)}`, summaryValueX, y, {
        width: summaryValueWidth,
        align: "right",
      });

    // GST
    y += 15;
    doc
      .font("Helvetica")
      .text("GST (18%):", summaryX, y)
      .font("Helvetica-Bold")
      .text(`₹${gstAmount.toFixed(2)}`, summaryValueX, y, {
        width: summaryValueWidth,
        align: "right",
      });

    // Delivery Charges
    y += 15;
    doc
      .font("Helvetica")
      .text("Delivery Charges:", summaryX, y)
      .font("Helvetica-Bold")
      .text(`₹${deliveryCharges.toFixed(2)}`, summaryValueX, y, {
        width: summaryValueWidth,
        align: "right",
      });

    // Grand Total
    y += 20;
    drawLine(y - 5, "#2c3e50", 1.5);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#2c3e50")
      .text("TOTAL AMOUNT:", summaryX, y)
      .fontSize(13)
      .text(`₹${grandTotal.toFixed(2)}`, summaryValueX, y, {
        width: summaryValueWidth,
        align: "right",
      });

    drawLine(y + 18, "#2c3e50", 1.5);

    // === TERMS & CONDITIONS ===
    y += 40;
    if (y < 720) {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#2c3e50")
        .text("Terms & Conditions:", 50, y)
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#555555")
        .text("• Goods once sold cannot be returned or exchanged.", 50, y + 15)
        .text(
          "• All disputes are subject to jurisdiction in the state of registration.",
          50,
          y + 27
        );
    }

    // === FOOTER ===
    doc
      .fontSize(9)
      .font("Helvetica-Oblique")
      .fillColor("#888888")
      .text(
        "Thank you for your purchase! For queries, contact siddhivinayakastroworld@gmail.com",
        50,
        760,
        { align: "center", width: 495 }
      );

    doc.end();

    console.log("✅ Invoice PDF generated successfully");
  } catch (error) {
    console.error("❌ Invoice PDF generation failed:", error);
    res.status(500).send("Server error");
  }
};
