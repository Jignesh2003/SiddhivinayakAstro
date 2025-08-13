import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";
import assets from "../assets/assets";
import ReviewSection from "../pages/ReviewPage"; // ✅ Import

const SingleOrder = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/order/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrder(response.data);
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

        <div className="bg-white/10 p-6 rounded-lg border border-white/20 mb-4">
          <h3 className="text-2xl font-semibold mb-3">Shipping Address</h3>
          <p>
            <strong>Name:</strong> {order.shippingAddress.name}
          </p>
          <p>
            <strong>Phone:</strong> {order.shippingAddress.phone}
          </p>
          <p>
            <strong>Address:</strong> {order.shippingAddress.address}
          </p>
          <p>
            <strong>City:</strong> {order.shippingAddress.city}
          </p>
          <p>
            <strong>State:</strong> {order.shippingAddress.state}
          </p>
          <p>
            <strong>Pincode:</strong> {order.shippingAddress.pincode}
          </p>
          <p>
            <strong>Landmark:</strong> {order.shippingAddress.landmark}
          </p>
        </div>

        {/* ✅ Show review section if delivered */}
        {order.orderStatus === "Delivered" &&
          order.product?.map((item) => (
            <ReviewSection
              key={item.product._id}
              productId={item.product._id}
              orderId={order._id}
            />
          ))}
      </div>
    </div>
  );
};

export default SingleOrder;
