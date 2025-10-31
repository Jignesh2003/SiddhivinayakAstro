import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const OrderSummary = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🆕 Helper to get item display name with variant/size
  const getItemDisplayName = (item) => {
    const baseName = item.product?.name || item.name || "Unknown Product";

    if (item.variantId && item.variant?.variantName) {
      return `${baseName} (${item.variant.variantName})`;
    }

    if (item.size) {
      return `${baseName} (Size: ${item.size})`;
    }

    return baseName;
  };

  // 🆕 Helper to get item price (variant or legacy)
  const getItemPrice = (item) => {
    if (item.variant?.price) {
      return item.variant.price;
    }
    return item.price || item.product?.price || 0;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/orders/${orderId}`
        );
        setOrder(response.data);
      } catch (err) {
        console.log(err);
        setError("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-purple-900 text-white text-lg">
        Loading order summary...
      </div>
    );

  if (error)
    return (
      <p className="text-center text-red-500 mt-10 text-lg">{error}</p>
    );

  if (!order)
    return (
      <p className="text-center text-gray-500 mt-10">No order found.</p>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-700 text-white py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md shadow-2xl rounded-xl p-8 border border-white/20">
        <h2 className="text-3xl font-bold text-center text-purple-100 mb-6">
          Order Summary
        </h2>

        <div className="space-y-2 text-purple-100">
          <p>
            <strong>Order ID:</strong> {order._id}
          </p>
          <p>
            <strong>Status:</strong> {order.orderStatus}
          </p>
          <p>
            <strong>Payment Status:</strong> {order.paymentStatus}
          </p>
        </div>

        <h3 className="text-2xl font-semibold text-purple-200 mt-6 mb-3">
          Items
        </h3>
        <ul className="divide-y divide-purple-300 bg-white/5 rounded-lg">
          {order.items.map((item) => {
            const displayName = getItemDisplayName(item);
            const itemPrice = getItemPrice(item);
            const itemTotal = itemPrice * (item.quantity || 1);

            return (
              <li
                key={item._id}
                className="px-4 py-3"
              >
                {/* Main item row */}
                <div className="flex justify-between">
                  <span className="flex-1">
                    {displayName}{" "}
                    <span className="text-sm text-purple-300">
                      (x{item.quantity || 1})
                    </span>
                  </span>
                  <span className="font-semibold">₹{itemTotal}</span>
                </div>

                {/* 🆕 Additional variant details */}
                {item.variant && (
                  <div className="mt-1 text-xs text-purple-300 space-y-0.5">
                    {item.variant.gram && (
                      <p>Weight: {item.variant.gram}g</p>
                    )}
                    {item.variant.sku && (
                      <p>SKU: {item.variant.sku}</p>
                    )}
                  </div>
                )}

                {/* 🆕 Price breakdown for transparency */}
                <div className="mt-1 text-xs text-purple-300">
                  ₹{itemPrice} × {item.quantity || 1} = ₹{itemTotal}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 text-lg space-y-2">
          <p className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{order.subtotal || order.totalAmount}</span>
          </p>
          <p className="flex justify-between">
            <span>Shipping:</span>
            <span>₹{order.shippingCost || 0}</span>
          </p>
          {/* 🆕 Show discount if applicable */}
          {order.discount && order.discount > 0 && (
            <p className="flex justify-between text-green-300">
              <span>Discount:</span>
              <span>-₹{order.discount}</span>
            </p>
          )}
          <p className="flex justify-between font-bold text-purple-200 text-xl border-t border-purple-400 mt-4 pt-4">
            <span>Total:</span>
            <span>₹{order.totalAmount}</span>
          </p>
        </div>

        <h3 className="text-2xl font-semibold text-purple-200 mt-8 mb-2">
          Shipping Address
        </h3>
        <div className="text-purple-100 space-y-1">
          {/* 🆕 Better address formatting */}
          {typeof order.shippingAddress === "string" ? (
            <p className="whitespace-pre-line">{order.shippingAddress}</p>
          ) : order.shippingAddress ? (
            <>
              <p className="font-semibold">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                {order.shippingAddress.pincode}
              </p>
              {order.shippingAddress.landmark && (
                <p className="text-sm text-purple-300">
                  Landmark: {order.shippingAddress.landmark}
                </p>
              )}
            </>
          ) : (
            <p className="text-purple-300">No shipping address provided</p>
          )}
        </div>

        {/* 🆕 Payment method section */}
        {order.paymentMethod && (
          <>
            <h3 className="text-2xl font-semibold text-purple-200 mt-8 mb-2">
              Payment Method
            </h3>
            <p className="text-purple-100">{order.paymentMethod}</p>
          </>
        )}

        {/* 🆕 Order date */}
        {order.createdAt && (
          <div className="mt-6 text-sm text-purple-300 text-center">
            Order placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;
