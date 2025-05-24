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
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/orders/${orderId}`);
        setOrder(response.data);
      } catch (err) {
        setError("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) return <p>Loading order summary...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!order) return <p>No order found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg" style={{ backgroundImage: `url(${assets.GalaxyBackground})` }}>
      <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
      <p><strong>Order ID:</strong> {order._id}</p>
      <p><strong>Status:</strong> {order.orderStatus}</p>
      <p><strong>Payment Status:</strong> {order.paymentStatus}</p>

      <h3 className="text-xl font-semibold mt-4">Items:</h3>
      <ul className="border-t pt-2">
        {order.items.map((item) => (
          <li key={item._id} className="flex justify-between p-2 border-b">
            <span>{item.name} (x{item.quantity})</span>
            <span>₹{item.price * item.quantity}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <p><strong>Subtotal:</strong> ₹{order.subtotal}</p>
        <p><strong>Shipping:</strong> ₹{order.shippingCost || 0}</p>
        <p className="text-lg font-bold mt-2">Total: ₹{order.totalAmount}</p>
      </div>

      <h3 className="text-xl font-semibold mt-4">Shipping Details:</h3>
      <p>{order.shippingAddress}</p>
    </div>
  );
};

export default OrderSummary;
