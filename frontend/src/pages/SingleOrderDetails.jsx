import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";
import assets from "../assets/assets";
import { Star } from "lucide-react";

const SingleOrder = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  // Review form states for each product
  const [reviews, setReviews] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [messages, setMessages] = useState({});

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

  const handleReviewChange = (productId, field, value) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleSubmitReview = async (productId) => {
    if (!reviews[productId]?.rating || !reviews[productId]?.comment) return;

    setSubmitting((prev) => ({ ...prev, [productId]: true }));

    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/products/${productId}/reviews`,
        {
          rating: reviews[productId].rating,
          text: reviews[productId].comment,
          orderId: order._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => ({
        ...prev,
        [productId]: "✅ Review submitted successfully!",
      }));

      // clear the form
      setReviews((prev) => ({
        ...prev,
        [productId]: { rating: "", comment: "" },
      }));
    } catch (err) {
      console.error(err);
      setMessages((prev) => ({
        ...prev,
        [productId]: "❌ Failed to submit review. Try again.",
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [productId]: false }));
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

  // Use items from backend
  const orderItems = Array.isArray(order.items) ? order.items : [];

  // Check delivered & items exist
  const isDelivered =
    order.orderStatus?.toLowerCase().trim() === "delivered" &&
    orderItems.length > 0;

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}
    >
      {/* Blurred Black Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Order content */}
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
              const prod = item.product;
              const reviews = Array.isArray(prod.reviews) ? prod.reviews : [];
              const rating = reviews.length
                ? Math.round(
                    reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
                  )
                : 0;
              return (
                <li key={item._id} className="py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      {/* Product Name & MiniDesc */}
                      <p className="font-semibold">{prod.name}</p>
                      <p className="text-xs text-gray-300 mb-1">
                        {prod.miniDesc}
                      </p>
                      <p className="text-sm text-gray-300">
                        Quantity: {item.quantity} &nbsp;|&nbsp; Price: ₹
                        {prod.price}
                      </p>
                      {/* Star Rating and Count */}
                      <div className="flex items-center text-yellow-400 mt-1">
                        {Array(rating)
                          .fill()
                          .map((_, i) => (
                            <Star key={i} size={14} />
                          ))}
                        <span className="ml-1 text-gray-400 text-xs">
                          ({reviews.length})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Form if delivered */}
                  {isDelivered && (
                    <div className="mt-4 bg-black/30 p-4 rounded">
                      {messages[prod._id] && (
                        <p className="mb-2 text-sm">{messages[prod._id]}</p>
                      )}
                      <label className="block mb-2 text-sm">Rating:</label>
                      <select
                        value={reviews[prod._id]?.rating || ""}
                        onChange={(e) =>
                          handleReviewChange(
                            prod._id,
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
                        value={reviews[prod._id]?.comment || ""}
                        onChange={(e) =>
                          handleReviewChange(
                            prod._id,
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
                        onClick={() => handleSubmitReview(prod._id)}
                        disabled={submitting[prod._id]}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        {submitting[prod._id]
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
