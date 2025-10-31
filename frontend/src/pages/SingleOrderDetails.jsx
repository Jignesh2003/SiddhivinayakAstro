import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";
import assets from "../assets/assets";

const SingleOrder = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  // Review form states for each product
  const [reviews, setReviews] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [messages, setMessages] = useState({});

  // 🆕 Helper to get item price (variant or legacy)
  const getItemPrice = (item) => {
    if (item.variantId && item.variant?.price) {
      return item.variant.price;
    }
    return item.product?.price || 0;
  };

  // 🆕 Helper to get item display name with variant/size info
  const getItemDisplayName = (item) => {
    const baseName = item.product?.name || "Unknown Product";

    if (item.variantId && item.variant?.variantName) {
      return `${baseName} (${item.variant.variantName})`;
    }

    if (item.size) {
      return `${baseName} (Size: ${item.size})`;
    }

    return baseName;
  };

  // 🆕 Helper to get unique review key (product + variant)
  const getReviewKey = (item) => {
    if (item.variantId) {
      return `${item.product._id}-${item.variantId}`;
    }
    return item.product._id;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/order/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrder(response.data);
        console.log("Fetched order:", response.data);
      } catch (error) {
        console.error(
          "Error fetching order:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, token]);

  // 🆕 Updated to use review key (supports variants)
  const handleReviewChange = (reviewKey, field, value) => {
    setReviews((prev) => ({
      ...prev,
      [reviewKey]: {
        ...prev[reviewKey],
        [field]: value,
      },
    }));
  };

  // 🆕 Updated to submit review with variant info
  const handleSubmitReview = async (item) => {
    const reviewKey = getReviewKey(item);

    if (!reviews[reviewKey]?.rating || !reviews[reviewKey]?.comment) return;

    setSubmitting((prev) => ({ ...prev, [reviewKey]: true }));

    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/products/${item.product._id}/reviews`,
        {
          rating: reviews[reviewKey].rating,
          text: reviews[reviewKey].comment,
          orderId: order._id,
          // 🆕 Include variant info if applicable
          variantId: item.variantId || null,
          variantName: item.variant?.variantName || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => ({
        ...prev,
        [reviewKey]: "✅ Review submitted successfully!",
      }));

      // Clear the form
      setReviews((prev) => ({
        ...prev,
        [reviewKey]: { rating: "", comment: "" },
      }));
    } catch (err) {
      console.error(err);
      setMessages((prev) => ({
        ...prev,
        [reviewKey]: "❌ Failed to submit review. Try again.",
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [reviewKey]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white text-lg">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white text-lg">
        Order not found.
      </div>
    );
  }

  // ✅ Use `items` from backend
  const orderItems = Array.isArray(order.items) ? order.items : [];

  // ✅ Check delivered & items exist
  const isDelivered =
    order.orderStatus?.toLowerCase().trim() === "delivered" &&
    orderItems.length > 0;

  console.log(isDelivered, orderItems);

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 max-w-3xl mx-auto text-white px-6 py-12">
        <h2 className="text-3xl font-bold mb-4">Order Details</h2>
        <p className="mb-1">
          <strong>Order ID:</strong> {order._id}
        </p>
        <p className="mb-1">
          <strong>Status:</strong> {order.orderStatus}
        </p>
        <p className="mb-1">
          <strong>Total Amount:</strong> ₹{order.totalAmount}
        </p>
        <p className="mb-4">
          <strong>Payment Status:</strong> {order.paymentStatus}
        </p>

        {/* Shipping Address */}
        <div className="bg-white/10 p-6 rounded-lg border border-white/20 mb-4">
          <h3 className="text-2xl font-semibold mb-3">Shipping Address</h3>
          <p>
            <strong>Name:</strong> {order.shippingAddress?.name}
          </p>
          <p>
            <strong>Phone:</strong> {order.shippingAddress?.phone}
          </p>
          <p>
            <strong>Address:</strong> {order.shippingAddress?.address}
          </p>
          <p>
            <strong>City:</strong> {order.shippingAddress?.city}
          </p>
          <p>
            <strong>State:</strong> {order.shippingAddress?.state}
          </p>
          <p>
            <strong>Pincode:</strong> {order.shippingAddress?.pincode}
          </p>
          {order.shippingAddress?.landmark && (
            <p>
              <strong>Landmark:</strong> {order.shippingAddress.landmark}
            </p>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white/10 p-6 rounded-lg border border-white/20 mb-6">
          <h3 className="text-2xl font-semibold mb-4">
            Products in this Order
          </h3>
          <ul className="divide-y divide-white/20">
            {orderItems.map((item) => {
              const reviewKey = getReviewKey(item);
              const itemPrice = getItemPrice(item);
              const displayName = getItemDisplayName(item);

              return (
                <li key={item._id} className="py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-semibold">{displayName}</p>

                      {/* 🆕 Enhanced item details */}
                      <div className="text-sm text-gray-300 space-y-1 mt-1">
                        <p>
                          Quantity: {item.quantity} &nbsp;|&nbsp; Price: ₹{itemPrice}
                        </p>

                        {/* 🆕 Show variant-specific details */}
                        {item.variant?.gram && (
                          <p className="text-xs text-gray-400">
                            Weight: {item.variant.gram}g
                          </p>
                        )}

                        {item.variant?.sku && (
                          <p className="text-xs text-gray-400">
                            SKU: {item.variant.sku}
                          </p>
                        )}

                        {/* Total for this item */}
                        <p className="font-medium text-white">
                          Subtotal: ₹{itemPrice * item.quantity}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Review Form */}
                  {isDelivered && (
                    <div className="mt-4 bg-black/30 p-4 rounded">
                      {messages[reviewKey] && (
                        <p className="mb-2 text-sm">
                          {messages[reviewKey]}
                        </p>
                      )}

                      <label className="block mb-2 text-sm">Rating:</label>
                      <select
                        value={reviews[reviewKey]?.rating || ""}
                        onChange={(e) =>
                          handleReviewChange(
                            reviewKey,
                            "rating",
                            Number(e.target.value)
                          )
                        }
                        className="p-2 rounded w-full text-black mb-3"
                        required
                      >
                        <option value="">Select Rating</option>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <option key={star} value={star}>
                            {star} Star{star > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>

                      <label className="block mb-2 text-sm">Review:</label>
                      <textarea
                        value={reviews[reviewKey]?.comment || ""}
                        onChange={(e) =>
                          handleReviewChange(
                            reviewKey,
                            "comment",
                            e.target.value
                          )
                        }
                        rows="3"
                        className="p-2 rounded w-full text-black mb-3"
                        placeholder="Write your review..."
                        required
                      />

                      <button
                        onClick={() => handleSubmitReview(item)}
                        disabled={submitting[reviewKey]}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        {submitting[reviewKey]
                          ? "Submitting..."
                          : "Submit Review"}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SingleOrder;
