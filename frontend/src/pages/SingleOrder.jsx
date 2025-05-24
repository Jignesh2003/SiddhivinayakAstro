import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const SingleOrder = () => {
  const { id } = useParams(); // Get order ID
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    console.log("Order ID from URL params:", id);
    console.log("Token from auth store:", token);
  }, [id, token]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        console.log("Fetching order with ID:", id);
        console.log("API URL:", `${import.meta.env.VITE_BASE_URL}/order/${id}`);

        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/order/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("API Response:", response.data); // Log the response
        setOrder(response.data);
      } catch (error) {
        console.error("Error fetching order:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, token]);

  if (loading) return <p>Loading order details...</p>;
  if (!order) return <p>Order not found.</p>;

  return (
    <div className="text-black-100 p-6">
      <h2 className="text-2xl font-bold">Order Details</h2>
      <p>Order ID: {order._id}</p>
      <p>Status: {order.orderStatus}</p>
      <p>Total Amount: ₹{order.totalAmount}</p>
      <p>Payment Status: {order.paymentStatus}</p>

      {/* Shipping Address */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold">Shipping Address</h3>
        <p>Name: {order.shippingAddress.name}</p>
        <p>Phone: {order.shippingAddress.phone}</p>
        <p>Address: {order.shippingAddress.address}</p>
        <p>City: {order.shippingAddress.city}</p>
        <p>State: {order.shippingAddress.state}</p>
        <p>Pincode: {order.shippingAddress.pincode}</p>
        <p>Landmark: {order.shippingAddress.landmark}</p>
      </div>
    </div>
  );
};

export default SingleOrder;