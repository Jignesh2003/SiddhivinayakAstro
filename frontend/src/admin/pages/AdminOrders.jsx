import { useEffect, useState } from "react";
import useOrderStore from "../../store/useOrderStore";
import axios from "axios";
import useAuthStore from "../../store/useAuthStore";

const AdminOrders = () => {
  const { allOrders = [], fetchAllOrders, updateOrderStatus, loading } = useOrderStore();
  const [selectedStatus, setSelectedStatus] = useState({});
  const [filter, setFilter] = useState("all"); // Default filter option
  const [error, setError] = useState(null);

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
      alert("Order status updated successfully! ✅");
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert("Failed to update order status. ❌");
    }
  };

  const markAsPaid = async (orderId) => {
    try {
      const { token } = useAuthStore.getState();
      await axios.put(
        `${import.meta.env.VITE_BASE_URL}/admin/orders/${orderId}`,
        { paymentStatus: "paid" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Order marked as Paid ✅");
      await fetchAllOrders(); // Refresh order list
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Failed to mark order as Paid ❌");
    }
  };

  // 🔍 Filter Orders Based on Status
  const filteredOrders = allOrders
    .filter((order) => filter === "all" || order.orderStatus === filter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest orders first

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-5">Manage Orders</h2>

      {/* 🔽 Filter Dropdown */}
      <div className="mb-4">
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

      {filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Order ID</th>
              <th className="border p-2">User</th>
              <th className="border p-2">Shipping Address</th>
              <th className="border p-20">Items</th>
              <th className="border p-2">Total</th>
              <th className="border p-2">Payment Status</th>
              <th className="border p-2">Order Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td className="border p-2">{order._id}</td>
                <td className="border p-2">{order.user?.email || "N/A"}</td>
                <td className="border p-2 text-sm">
                  <p><strong>Name:</strong> {order.shippingAddress?.name || "N/A"}</p>
                  <p><strong>Phone:</strong> {order.shippingAddress?.phone || "N/A"}</p>
                  <p>
                    <strong>Address:</strong> {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                  </p>
                  <p><strong>Landmark:</strong> {order.shippingAddress?.landmark || "N/A"}</p>
                </td>
                <td className="border p-2 text-sm">
                  <div className="flex flex-col gap-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 border-b pb-2 last:border-0">
                        <div className="flex flex-col min-w-0">
                          <p className="font-semibold break-words">{item.product?.name || "Unknown"}</p>
                          <p className="text-sm text-gray-600"><strong>Qty:</strong> {item.quantity}</p>
                          <p className="text-sm text-gray-600"><strong>Seller:</strong> {item.seller?.name || "N/A"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="border p-2">₹{order.totalAmount}</td>
                <td className="border p-2">{order.paymentStatus}</td>
                <td className="border p-2">
                  <select
                    value={selectedStatus[order._id] || order.orderStatus}
                    onChange={(e) =>
                      setSelectedStatus({ ...selectedStatus, [order._id]: e.target.value })
                    }
                    className="border p-1 rounded"
                  >
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="on-way">On Way</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleStatusChange(order._id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                  >
                    Update
                  </button>
                  {order.paymentStatus === "pending" && (
                    <button
                      onClick={() => markAsPaid(order._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Mark as Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminOrders;
