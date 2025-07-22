import { useEffect } from "react";
import useCartStore from "../store/useCartStore";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";

const Cart = () => {
  const { cart, fetchCart, updateCart, removeFromCart, loading } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    // Remove out-of-stock items automatically
    cart.forEach((item) => {
      if (item.availableStock === 0) {
        removeFromCart(item.product._id, item.size ?? null);
        toast.warn(
          `Removed ${item.product.name} (Out of Stock)`,
          { position: "top-right" }
        );
      }
    });
    // eslint-disable-next-line
  }, [cart]);

  const handleUpdateCart = async (productId, newQuantity, availableStock, size) => {
    if (newQuantity > availableStock) {
      toast.error("Cannot exceed available stock!", { position: "top-right" });
      return;
    }
    if (newQuantity < 1) return;
    try {
      await updateCart(productId, newQuantity, size);
      toast.success("Cart updated successfully!", { position: "top-right" });
      await fetchCart();
    } catch (error) {
      toast.error("Failed to update cart.", { position: "top-right" });
    }
  };

  const handleRemoveFromCart = async (productId, size) => {
    try {
      await removeFromCart(productId, size);
      toast.success("Item removed from cart!", { position: "top-right" });
      await fetchCart();
    } catch (error) {
      toast.error("Failed to remove item.", { position: "top-right" });
    }
  };

  const totalPrice = cart.reduce((total, item) => {
    if (!item.product || !item.product.price) return total;
    return total + item.product.price * (item.cartQuantity ?? item.quantity ?? 1);
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
            if (!item.product) return null;
            const availableStock = item.availableStock ?? 0;
            return (
              <div
                key={item.product._id + (item.size ?? "")}
                className="flex items-center justify-between border-b py-3"
              >
                {/* Product Image */}
                <img
                  src={item.product?.image?.[0] || "/placeholder.png"}
                  alt={item.product.name || "Product Image"}
                  className="w-30 h-30 object-cover rounded-md mr-4"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {item.product.name || "Unknown Product"}{" "}
                    {item.size ? `(Size: ${item.size})` : ""}
                  </h3>
                  <p>Price: ₹{item.product.price ?? "N/A"}</p>
                  <p
                    className={
                      availableStock === 0
                        ? "text-red-600"
                        : availableStock < 10
                        ? "text-orange-600"
                        : "text-green-600"
                    }
                  >
                    {availableStock > 0
                      ? `Stock: ${availableStock}${availableStock < 10 ? " (Hurry!)" : ""}`
                      : "SORRY! Out of Stock"}
                  </p>
                  <p className="font-semibold">
                    Quantity: {item.cartQuantity ?? item.quantity ?? 1}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() =>
                        handleUpdateCart(
                          item.product._id,
                          (item.cartQuantity ?? item.quantity ?? 1) + 1,
                          availableStock,
                          item.size
                        )
                      }
                      className={`px-2 py-1 rounded ${
                        (item.cartQuantity ?? item.quantity ?? 1) >= availableStock
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 text-white"
                      }`}
                      disabled={
                        (item.cartQuantity ?? item.quantity ?? 1) >= availableStock
                      }
                    >
                      +
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateCart(
                          item.product._id,
                          (item.cartQuantity ?? item.quantity ?? 1) - 1,
                          availableStock,
                          item.size
                        )
                      }
                      className="px-2 py-1 bg-yellow-500 text-white rounded"
                      disabled={(item.cartQuantity ?? item.quantity ?? 1) <= 1}
                    >
                      -
                    </button>
                    <button
                      onClick={() =>
                        handleRemoveFromCart(item.product._id, item.size)
                      }
                      className="px-2 py-1 bg-red-500 text-white rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="font-bold">
                  ₹{item.product.price * (item.cartQuantity ?? item.quantity ?? 1)}
                </p>
              </div>
            );
          })}
          <div className="mt-4 text-xl font-bold text-right">
            Total: ₹{totalPrice}
          </div>
          <Link
            to="/checkout"
            className="block w-full mt-4 text-center bg-blue-500 text-white py-2 rounded"
          >
            Proceed to Checkout
          </Link>
        </div>
      )}
    </div>
  );
};

export default Cart;
