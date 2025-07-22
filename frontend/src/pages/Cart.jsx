import { useEffect } from "react";
import useCartStore from "../store/useCartStore";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";

const Cart = () => {
  const {
    cart,
    fetchCart,
    updateCart,
    removeFromCart,
    loading,
    addToCart
  } = useCartStore();

  useEffect(() => {
    fetchCart();
    console.log("Calling fetchCart from useEffect");
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    cart.forEach((item) => {
      if (item.availableStock === 0) {
        removeFromCart(item.product._id, item.size ?? null);
        toast.warn(`Removed ${item.product.name} (Out of Stock)`, {
          position: "top-right",
        });
      }
    });
    // eslint-disable-next-line
  }, [cart]);

  const handleUpdateCart = async (
    productId,
    newQuantity,
    availableStock,
    size
  ) => {
    const safeQty = Number(newQuantity);
    if (!Number.isFinite(safeQty) || safeQty < 1) return;
    if (safeQty > availableStock) {
      toast.error("Cannot exceed available stock!", { position: "top-right" });
      return;
    }
    try {
      await updateCart(productId, safeQty, size, availableStock);
      toast.success("Cart updated successfully!", { position: "top-right" });
      await fetchCart();
    } catch {
      toast.error("Failed to update cart.", { position: "top-right" });
    }
  };

  const handleRemoveFromCart = async (productId, size) => {
    try {
      await removeFromCart(productId, size);
      toast.success("Item removed from cart!", { position: "top-right" });
      await fetchCart();
    } catch {
      toast.error("Failed to remove item.", { position: "top-right" });
    }
  };

  const handleIncrement = (item) => {
    if (
      Number(item.cartQuantity ?? item.quantity ?? 1) <
      Number(item.availableStock ?? 1)
    ) {
      handleUpdateCart(
        item.product._id,
        Number(item.cartQuantity ?? item.quantity ?? 1) + 1,
        Number(item.availableStock ?? 1),
        item.size
      );
    } else {
      toast.warn("Cannot add more than available stock!", {
        position: "top-right"
      });
    }
  };

  const handleDecrement = (item) => {
    if (Number(item.cartQuantity ?? item.quantity ?? 1) > 1) {
      handleUpdateCart(
        item.product._id,
        Number(item.cartQuantity ?? item.quantity ?? 1) - 1,
        Number(item.availableStock ?? 1),
        item.size
      );
    }
  };

  const totalPrice = cart.reduce((total, item) => {
    if (!item.product || !item.product.price) return total;
    return (
      total + item.product.price * Number(item.cartQuantity ?? item.quantity ?? 1)
    );
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
            const currQty = Number(item.cartQuantity ?? item.quantity ?? 1);
            const availableStock = Number(item.availableStock ?? 1);

            return (
              <div
                key={item.product._id + (item.size ?? "")}
                className="flex items-center justify-between border-b py-3"
              >
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
                      ? `Stock: ${availableStock}${
                          availableStock < 10 ? " (Hurry!)" : ""
                        }`
                      : "SORRY! Out of Stock"}
                  </p>
                  <p className="font-semibold">Quantity: {currQty}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleIncrement(item)}
                      className={`px-2 py-1 rounded ${
                        currQty >= availableStock
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 text-white"
                      }`}
                      disabled={currQty >= availableStock}
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleDecrement(item)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded"
                      disabled={currQty <= 1}
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
                  ₹{item.product.price * currQty}
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
