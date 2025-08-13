import { useEffect, useState } from "react";
import useOrderStore from "../../store/useOrderStore";
import useAuthStore from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AdminOrders = () => {
  const {
    allOrders = [],
    fetchAllOrders,
    updateOrderStatus,
    loading,
  } = useOrderStore();
  const [selectedStatus, setSelectedStatus] = useState({});
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const { token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        await fetchAllOrders();
      } catch (err) {
        setError("Failed to load orders. Please try again.");
        console.error("Error fetching orders:", err);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId) => {
    if (!selectedStatus[orderId]) return;
    try {
      await updateOrderStatus(orderId, selectedStatus[orderId]);
      toast.success("Order status updated ✅");
      await fetchAllOrders();
    } catch (err) {
      console.error("Failed to update order status:", err);
      toast.error("Failed to update order status ❌");
    }
  };

  const markAsPaid = async (orderId) => {
    try {
      await fetch(`${import.meta.env.VITE_BASE_URL}/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentStatus: "Paid" }),
      });
      toast.success("Order marked as Paid ✅");
      await fetchAllOrders();
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to mark order as Paid ❌");
    }
  };

  const filteredOrders = allOrders
    .filter(
      (order) =>
        filter === "all" ||
        order.orderStatus?.toLowerCase() === filter.toLowerCase()
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="flex min-h-screen bg-gray-100 py-10 px-6 md:px-20">
      <div className="flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">📦 All Orders</h2>
          <div>
            <label className="font-semibold mr-2">Filter by Status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="on-way">On Way</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-gray-600">No orders found.</p>
        ) : (
          <div className="space-y-8">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-md border p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order Date: {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <h3 className="text-xl font-semibold text-indigo-600">
                      Order ID: {order._id}
                    </h3>
                  </div>
                  <div className="text-right text-sm">
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className="text-indigo-500">
                        {order.orderStatus}
                      </span>
                    </p>
                    <p>
                      <strong>Payment:</strong> {order.paymentMethod} (
                      {order.paymentStatus})
                    </p>
                  </div>
                </div>

                {/* Customer & Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">
                      👤 Customer Info
                    </h4>
                    <p>
                      {order.user?.name} ({order.user?.email})
                    </p>
                    <p>📞 {order.shippingAddress?.phone}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">
                      🏠 Shipping Address
                    </h4>
                    <p>
                      {order.shippingAddress?.name},{" "}
                      {order.shippingAddress?.address},<br />
                      {order.shippingAddress?.city},{" "}
                      {order.shippingAddress?.state} -{" "}
                      {order.shippingAddress?.pincode}
                      <br />
                      <span className="italic text-xs">
                        Landmark: {order.shippingAddress?.landmark || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Order Total */}
                <div className="text-sm text-gray-700">
                  <h4 className="font-medium text-gray-800 mb-1">
                    💰 Order Summary
                  </h4>
                  <p>
                    Total:{" "}
                    <span className="font-semibold text-lg text-green-600">
                      ₹{order.totalAmount}
                    </span>
                  </p>
                </div>

                {/* Status + Tracking */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mt-4">
                  <div className="flex items-center gap-3">
                    <label className="font-medium">Order Status:</label>
                    <select
                      value={selectedStatus[order._id] || order.orderStatus}
                      onChange={(e) =>
                        setSelectedStatus({
                          ...selectedStatus,
                          [order._id]: e.target.value,
                        })
                      }
                      className="border px-3 py-2 rounded bg-gray-50"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="On-way">On Way</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out-for-delivery">Out for delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => handleStatusChange(order._id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      Update
                    </button>
                  </div>

                  {order.paymentStatus?.toLowerCase() === "pending" && (
                    <button
                      onClick={() => markAsPaid(order._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>

                {/* Products List */}
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 mb-2">🛍 Products</h4>
                  <ul className="space-y-2">
                    {order.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-4 bg-gray-50 p-2 rounded-md"
                      >
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product?.name}
                            className="w-12 h-12 object-cover border rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-sm text-gray-500">
                            Size: {item.size || "N/A"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Invoice Redirect */}
                  <button
                    onClick={() => navigate(`/admin/invoice/${order._id}`)}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    📄 Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
