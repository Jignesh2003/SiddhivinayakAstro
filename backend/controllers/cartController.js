import Cart from "../models/cart.js";
import Product from "../models/Product.js";

// 📌 Add item to cart (with variant support)
export const addToCart = async (req, res) => {
  try {
    const { product, size = null, quantity = 1, variantId = null, variant = null } = req.body;
    const userId = req.user.id;

    console.log("🛒 Adding to cart:", { product, size, variantId, quantity });

    // Validate product exists
    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log(`📦 Product: ${productDoc.name} - Stock available`);

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // 🆕 Check for duplicate with variant/size support
    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === product &&
        // Match by variant if present
        ((variantId && item.variantId?.toString() === variantId) ||
          // Or match by size (legacy)
          (size && item.size === size) ||
          // Or match simple product
          (!variantId && !size && !item.variantId && !item.size))
    );

    if (existingItem) {
      console.log("ℹ️ Item already in cart, not incrementing");
      return res.status(400).json({ message: "Product already in cart" });
    }

    // Add new item to cart
    const newItem = {
      product,
      quantity,
      size: size || null,
      variantId: variantId || null,
      variant: variant || null,
    };

    cart.items.push(newItem);
    await cart.save();

    console.log("✅ Item added to cart");

    res.status(200).json({
      message: "Added to cart",
      items: cart.items,
    });
  } catch (error) {
    console.error("❌ Error adding to cart:", error);
    res.status(500).json({
      message: "Error adding to cart",
      error: error.message,
    });
  }
};

// 📌 Get user's cart (with variant support and live stock)
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id || req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.json({ items: [] });
    }

    // Build cart with per-item live stock and pricing
    const cartWithStock = cart.items.map((item) => {
      let availableStock = 0;
      let itemPrice = 0;

      if (item.product) {
        // 🆕 Handle variant products
        if (item.variantId && item.product.hasVariants) {
          const variantItem = item.product.variants?.find(
            (v) => v._id.toString() === item.variantId.toString()
          );

          if (variantItem) {
            availableStock = variantItem.stock || 0;
            itemPrice = variantItem.price || 0;
          }
        }
        // Handle legacy products with size
        else if (item.size && item.product.stock) {
          const stockEntry = item.product.stock.find(
            (entry) => entry.size === item.size
          );
          availableStock = stockEntry ? Number(stockEntry.quantity) : 0;
          itemPrice = item.product.price || 0;
        }
        // Handle simple products (no variant, no size)
        else {
          availableStock = item.product.stock.reduce(
            (sum, entry) => sum + Number(entry.quantity || 0),
            0
          );
          itemPrice = item.product.price || 0;
        }
      }

      return {
        _id: item._id,
        product: {
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          hasVariants: item.product.hasVariants,
        },
        cartQuantity: item.quantity,
        quantity: item.quantity,
        // 🆕 Include variant info
        variantId: item.variantId || null,
        variant: item.variant || null,
        size: item.size || null,
        availableStock,
        cartPrice: itemPrice, // Price for this specific item
      };
    });

    // No-cache headers
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    console.log(`✅ Cart fetched for user ${userId}: ${cartWithStock.length} items`);

    return res.json({
      items: cartWithStock,
      cartId: cart._id,
    });
  } catch (error) {
    console.error("❌ Error fetching cart:", error);
    res.status(500).json({
      message: "Error fetching cart",
      error: error.message,
    });
  }
};

// 📌 Remove item from cart (with variant support)
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { size = null, variantId = null } = req.query;

    console.log("🗑️ Removing from cart:", { productId, size, variantId });

    if (!userId || !productId) {
      return res.status(400).json({ message: "Missing userId or productId" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // 🆕 Filter with variant/size support
    const initialLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          // Match by variant if provided
          ((variantId && item.variantId?.toString() === variantId) ||
            // Or match by size (legacy)
            (size && item.size === size) ||
            // Or match simple product
            (!variantId && !size && !item.variantId && !item.size))
        )
    );

    const removed = initialLength - cart.items.length;

    if (removed === 0) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await cart.save();

    console.log(`✅ Removed ${removed} item(s) from cart`);

    res.status(200).json({
      message: "Item removed",
      items: cart.items,
    });
  } catch (error) {
    console.error("❌ Error removing item:", error);
    res.status(500).json({
      message: "Error removing item",
      error: error.message,
    });
  }
};

// 📌 Update item quantity in cart (with variant support)
export const updateCart = async (req, res) => {
  try {
    const { productId, quantity, size = null, variantId = null } = req.body;
    const userId = req.user.id;

    console.log("🔄 Updating cart:", { productId, quantity, size, variantId });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found for this user" });
    }

    // 🆕 Find item with variant/size support
    const item = cart.items.find(
      (cartItem) =>
        cartItem.product.toString() === productId &&
        // Match by variant if provided
        ((variantId && cartItem.variantId?.toString() === variantId) ||
          // Or match by size (legacy)
          (size && cartItem.size === size) ||
          // Or match simple product
          (!variantId && !size && !cartItem.variantId && !cartItem.size))
    );

    if (!item) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Validate quantity
    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    // 🆕 Check available stock
    const product = await Product.findById(productId);
    let availableStock = 0;

    if (variantId && product.hasVariants) {
      const variant = product.variants.find(
        (v) => v._id.toString() === variantId.toString()
      );
      availableStock = variant?.stock || 0;
    } else if (size && product.stock) {
      const stockEntry = product.stock.find((s) => s.size === size);
      availableStock = stockEntry?.quantity || 0;
    } else {
      availableStock = product.stock.reduce(
        (sum, s) => sum + (s.quantity || 0),
        0
      );
    }

    if (quantity > availableStock) {
      return res.status(400).json({
        message: `Cannot exceed available stock. Available: ${availableStock}`,
      });
    }

    item.quantity = quantity;
    await cart.save();

    console.log(`✅ Cart updated: quantity set to ${quantity}`);

    const updatedCart = await Cart.findOne({ user: userId }).populate(
      "items.product"
    );

    res.status(200).json({
      message: "Cart updated",
      items: updatedCart.items,
    });
  } catch (error) {
    console.error("❌ Update Cart Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 📌 Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    console.log(`✅ Cart cleared for user ${userId}`);

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("❌ Error clearing cart:", error);
    res.status(500).json({
      message: "Error clearing cart",
      error: error.message,
    });
  }
};
