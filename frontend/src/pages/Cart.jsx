import { useEffect } from "react";
import useCartStore from "../store/useCartStore";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";

const Cart = () => {
  const { cart, fetchCart, updateCart, removeFromCart, loading } = useCartStore();

  useEffect(() => {
    fetchCart(); // ✅ Fetch cart when component mounts
  }, []);

  useEffect(() => {
    // Remove out-of-stock items automatically
    cart.forEach((item) => {
      if (item.product?.stock === 0) {
        removeFromCart(item.product._id);
        toast.warn(`Removed ${item.product.name} (Out of Stock)`, { position: "top-right" });
      }
    });
  }, [cart]);

  const handleUpdateCart = async (productId, newQuantity, stock) => {
    if (newQuantity > stock) {
      toast.error("Cannot exceed available stock!", { position: "top-right" });
      return;
    }
    try {
      await updateCart(productId, newQuantity);
      toast.success("Cart updated successfully!", { position: "top-right" });
      await fetchCart(); // ✅ Always re-fetch to ensure latest state
    } catch (error) {
      console.error("Error updating cart:", error);
      toast.error("Failed to update cart.", { position: "top-right" });
    }
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      await removeFromCart(productId);
      toast.success("Item removed from cart!", { position: "top-right" });
      await fetchCart(); // ✅ Re-fetch cart after removal
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item.", { position: "top-right" });
    }
  };

  const totalPrice = cart.reduce((total, item) => {
    if (!item.product || !item.product.price) return total;
    return total + item.product.price * item.quantity;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <ClipLoader color="#000" size={50} />
        </div>
      ) : !Array.isArray(cart) || cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          {cart.map((item) => {
            if (!item.product) {
              console.warn("Cart item missing product data:", item);
              return null;
            }

            return (
              <div key={item._id} className="flex items-center justify-between border-b py-3">
                {/* Product Image */}
                <img
                  src={item.product.image || "/placeholder.png"}
                  alt={item.product.name || "Product Image"}
                  className="w-30 h-30 object-cover rounded-md mr-4"
                />

                <div className="flex-1">
                  <h3 className="font-semibold">{item.product.name || "Unknown Product"}</h3>
                  <p>Price: ₹{item.product.price ?? "N/A"}</p>
                  <p className={item.product.stock < 10 ? "text-red-500" : "text-green-500"}>
                    Stock: {item.product.stock > 0 ? `Only ${item.product.stock} left hurry !` : "SORRY ! Out of Stock"}
                  </p>
                  <p className="font-semibold">Quantity: {item.quantity}</p>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdateCart(item.product._id, item.quantity + 1, item.product.stock)}
                      className={`px-2 py-1 rounded ${item.quantity >= item.product.stock ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 text-white"}`}
                      disabled={item.quantity >= item.product.stock}
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        if (item.quantity > 1) {
                          handleUpdateCart(item.product._id, item.quantity - 1, item.product.stock);
                        }
                      }}
                      className="px-2 py-1 bg-yellow-500 text-white rounded"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleRemoveFromCart(item.product._id)}
                      className="px-2 py-1 bg-red-500 text-white rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="font-bold">₹{item.product.price ? item.product.price * item.quantity : "N/A"}</p>
              </div>
            );
          })}

          {/* Display total price */}
          <div className="mt-4 text-xl font-bold text-right">Total: ₹{totalPrice}</div>

          <Link to="/checkout" className="block w-full mt-4 text-center bg-blue-500 text-white py-2 rounded">
            Proceed to Checkout
          </Link>
        </div>
      )}
    </div>
  );
};

export default Cart;
