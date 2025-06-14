import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const OrderSummary = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          {order.items.map((item) => (
            <li
              key={item._id}
              className="flex justify-between px-4 py-3"
            >
              <span>
                {item.name} <span className="text-sm text-purple-300">(x{item.quantity})</span>
              </span>
              <span>₹{item.price * item.quantity}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 text-lg space-y-2">
          <p className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{order.subtotal}</span>
          </p>
          <p className="flex justify-between">
            <span>Shipping:</span>
            <span>₹{order.shippingCost || 0}</span>
          </p>
          <p className="flex justify-between font-bold text-purple-200 text-xl pt-2 border-t border-purple-400 mt-4 pt-4">
            <span>Total:</span>
            <span>₹{order.totalAmount}</span>
          </p>
        </div>

        <h3 className="text-2xl font-semibold text-purple-200 mt-8 mb-2">
          Shipping Address
        </h3>
        <p className="text-purple-100 whitespace-pre-line">
          {order.shippingAddress}
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;
