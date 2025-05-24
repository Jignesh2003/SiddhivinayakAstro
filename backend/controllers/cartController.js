import Cart from "../models/cart.js";

// 📌 Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { product, quantity = 1 } = req.body; 
    const userId = req.user.id; // ✅ Use authenticated user ID

    if (!userId || !product) {
      return res.status(400).json({ message: "User ID and Product ID are required" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find((item) => item.product.toString() === product);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product, quantity });
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
    const { userId } = req.params; // ✅ Extract userId from params
    console.log(userId);
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
  
    console.log("Fetching cart for user:", userId);
    const cart = await Cart.findOne({ userId }).populate("items.product");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // ✅ Force fresh response
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    res.json(cart);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching cart", error: error.message });
  }
};

// 📌 Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { userId } = req.query;  // ✅ Extract from query params
    const { productId } = req.params; 

    if (!userId || !productId) {
      return res.status(400).json({ message: "Missing userId or productId" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();

    res.status(200).json({ message: "Item removed", cart });
  } catch (error) {
    res.status(500).json({ message: "Error removing item", error: error.message });
  }
};

export const updateCart = async (req, res) => {
  try {
    console.log("Decoded User ID:", req.user?.id);

    const { productId, quantity } = req.body;
    const userId = req.user.id; // Extracted from token

    if (!userId) {
      return res.status(400).json({ message: "User ID missing from token" });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    // ✅ Find the user's cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found for this user" });
    }

    // ✅ Find the product in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // ✅ Update the quantity
    cart.items[itemIndex].quantity = quantity;

    // ✅ Save changes
    await cart.save();

    // ✅ Return the updated cart with product details
    const updatedCart = await Cart.findOne({ userId }).populate("items.product");

    return res.status(200).json({ message: "Cart updated", cart: updatedCart });
  } catch (error) {
    console.error("Update Cart Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//empty cart when user order succesfull
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

    cart.items = []; // ✅ Empty cart
    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Error clearing cart", error: error.message });
  }
};