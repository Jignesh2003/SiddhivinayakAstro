import Cart from "../models/cart.js";
import Product from "../models/Product.js";
import { updateCartSchema } from "../validation/cartValidation.js";

// 📌 Add item to cart
export const addToCart = async (req, res) => {
  try {

    const { product, size, quantity = 1 } = req.body;
    console.log(product);

    const userId = req.user.id;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const productDoc = await Product.findById(product);
    console.log(`Adding to cart: ${productDoc.name} - Current stock:`, productDoc.stock);
    const existingItem = cart.items.find(item => item.product.toString() === product);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product, quantity, size });
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Error adding to cart", error: error.message });
  }
};

// 📌 Get user's cart
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const cart = await Cart.findOne({ userId }).populate("items.product");
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Build cart with per-item live stock
    const cartWithStock = cart.items.map(item => {
      let availableStock = 0;

      if (item.product) {
        if (item.product.sizeType !== "Quantity" && item.size) {
          // Variant stock (size-based)
          const stockEntry = item.product.stock.find(
            (entry) => entry.size === item.size
          );
          availableStock = stockEntry ? Number(stockEntry.quantity) : 0;
        } else {
          // Non-size product: sum all stock
          availableStock = item.product.stock.reduce(
            (sum, entry) => sum + Number(entry.quantity || 0),
            0
          );
        }
      }

      return {
        product: {
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
        },
        cartQuantity: item.quantity,
        size: item.size || null,
        availableStock,
      };
    });


    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    return res.json({
      items: cartWithStock,
      cartId: cart._id,
      totalPrice: cart.totalPrice, // if you store it
      // ...other cart-level info if needed
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching cart", error: error.message });
  }
};


// 📌 Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { userId } = req.query;
    const { productId } = req.params;

    if (!userId || !productId) {
      return res.status(400).json({ message: "Missing userId or productId" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();

    res.status(200).json({ message: "Item removed", cart });
  } catch (error) {
    res.status(500).json({ message: "Error removing item", error: error.message });
  }
};

// 📌 Update item quantity in cart
export const updateCart = async (req, res) => {
  try {
    const { error } = updateCartSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found for this user" });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findOne({ userId }).populate("items.product");
    res.status(200).json({ message: "Cart updated", cart: updatedCart });
  } catch (error) {
    console.error("Update Cart Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 📌 Clear cart
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Error clearing cart", error: error.message });
  }
};
