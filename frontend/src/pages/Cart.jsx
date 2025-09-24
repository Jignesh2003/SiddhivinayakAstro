import { useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import useCartStore from "../store/useCartStore";
import assets from "@/assets/assets";
import CouponItems from "@/utils/CouponItems";
import useCouponStore from "@/store/useCouponStore";

const Cart = () => {
  const fetchCoupons = useCouponStore((state) => state.fetchCoupons);
  const cart = useCartStore((state) => state.cart);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const updateCart = useCartStore((state) => state.updateCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const loading = useCartStore((state) => state.loading);
  const appliedCoupon = useCouponStore((state) => state.appliedCoupon);


  const totalPrice = cart.reduce((total, item) => {
    const price = Number(item.product?.price ?? 0);
    const qty = Number(item.cartQuantity ?? item.quantity ?? 1);
    return total + price * qty;
  }, 0);

  const discountedTotal = appliedCoupon
    ? Math.max(
      totalPrice -
      (appliedCoupon.discountType === "flat"
        ? appliedCoupon.discount // flat coupon uses backend discount
        : Math.min(
          (totalPrice * appliedCoupon.discountValue) / 100,
          appliedCoupon.maxDiscount || Infinity
        )), // percentage coupon recalculated
      0
    )
    : totalPrice;

  useEffect(() => {
    const loadCartAndCoupons = async () => {
      await fetchCart();  // ensures cart is loaded
      await fetchCoupons(); // now cart has items
    };
    loadCartAndCoupons();
  }, []);

  useEffect(() => {
    const loadCart = async () => {
      await fetchCart();
    };
    loadCart();
  }, [fetchCart]);


  useEffect(() => {
    fetchCoupons();
  }, [cart]); // <-- re-run whenever cart changes


  useEffect(() => {
    cart.forEach((item) => {
      if (item.availableStock === 0) {
        removeFromCart(item.product._id, item.size ?? null);
        toast.warn(`Removed ${item.product.name} (Out of Stock)`, {
          position: "top-right",
        });
      }
    });
  }, [cart]);

  // const handleUpdateCart = async (
  //   productId,
  //   newQuantity,
  //   availableStock,
  //   size
  // ) => {
  //   const safeQty = Number(newQuantity);
  //   if (!Number.isFinite(safeQty) || safeQty < 1) return;

  //   if (safeQty > availableStock) {
  //     toast.error("Cannot exceed available stock!", { position: "top-right" });
  //     return;
  //   }

  //   try {
  //     await updateCart(productId, safeQty, size, availableStock);
  //     toast.success("Cart updated successfully!", { position: "top-right" });
  //     await fetchCart();
  //   } catch {
  //     toast.error("Failed to update cart.", { position: "top-right" });
  //   }
  // };

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
    const currQty = Number(item.cartQuantity ?? item.quantity ?? 1);
    const available = Number(item.availableStock ?? 1);

    if (currQty < available) {
      // Optimistically update UI
      updateCart(item.product._id, currQty + 1, item.size, available);
    } else {
      toast.warn("Cannot add more than available stock!", {
        position: "top-right",
      });
    }
  };


  const handleDecrement = (item) => {
    const currQty = Number(item.cartQuantity ?? item.quantity ?? 1);
    if (currQty > 1) {
      updateCart(item.product._id, currQty - 1, item.size, item.availableStock);
    }
  };


 

  return (
    <div
      className="min-h-screen bg-gray-100 py-10 px-4"
      style={{
        backgroundImage: `url(${assets.GalaxyBackground})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        zIndex: -1,
      }}
    >
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold mb-6 text-amber-700 text-center">
          Shopping Cart
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-10 text-amber-700">
            <ClipLoader color="#d97706" size={50} />
          </div>
        ) : !Array.isArray(cart) || cart.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">
            Your cart is empty.
          </p>
        ) : (
          <>
            {cart.map((item) => {
              if (!item.product) return null;

              const currQty = Number(item.cartQuantity ?? item.quantity ?? 1);
              const availableStock = Number(item.availableStock ?? 1);

              return (
                <div
                  key={item.product._id + (item.size ?? "")}
                  className="flex items-center justify-between border-b border-gray-300 py-4"
                >
                  <img
                    src={item.product?.image?.[0] || "/placeholder.png"}
                    alt={item.product.name || "Product Image"}
                    className="w-28 h-28 object-cover rounded-md mr-6"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {item.product.name || "Unknown Product"}{" "}
                      {item.size ? `(Size: ${item.size})` : ""}
                    </h3>
                    <p className="text-gray-600">
                      Price: ₹{item.product.price ?? "N/A"}
                    </p>
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
                    <p className="font-semibold mt-1">Quantity: {currQty}</p>

                    {/* Quantity controls */}
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => handleIncrement(item)}
                        className={`px-3 py-1 rounded ${
                          currQty >= availableStock
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                        disabled={currQty >= availableStock}
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleDecrement(item)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        disabled={currQty <= 1}
                      >
                        -
                      </button>
                      <button
                        onClick={() =>
                          handleRemoveFromCart(item.product._id, item.size)
                        }
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="font-bold text-gray-900 text-xl">
                    ₹{Number(item.product.price ?? 0) * currQty}
                  </p>
                </div>
              );
            })}

            {/* Cart Footer */}
                {/* Cart Footer */}
                <div className="mt-6 flex justify-end gap-4 items-center border-t border-gray-300 pt-6 flex-col md:flex-row md:items-center">
                  {appliedCoupon && (
                    <div className="flex items-center gap-3">
                      <p className="text-green-700 font-semibold text-lg">
                        Coupon {appliedCoupon.code} Applied: -₹
                        {appliedCoupon.discountType === "flat"
                          ? appliedCoupon.discount.toFixed(2)
                          : Math.min(
                            (totalPrice * appliedCoupon.discountValue) / 100,
                            appliedCoupon.maxDiscount || Infinity
                          ).toFixed(2)}
                      </p>
                      <button
                        onClick={() => {
                          useCouponStore.getState().clearCoupon();
                          toast.info("Coupon removed", { position: "top-right" });
                        }}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <h3 className="text-2xl font-semibold text-gray-800">
                    Total: ₹{discountedTotal.toFixed(2)}
                  </h3>

                  <Link
                    to="/checkout"
                    state={{ appliedCoupon: appliedCoupon }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    Proceed to Checkout
                  </Link>
                </div>



          </>
        )}
      </div>
      <CouponItems/>
    </div>
  );
};

export default Cart;
