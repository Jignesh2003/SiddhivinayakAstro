import { useEffect } from "react";
import { Link } from "react-router-dom";
import useOrderStore from "../store/useOrderStore";
import { Package, IndianRupee } from "lucide-react";
import assets from "../assets/assets";
import ClipLoader from "react-spinners/ClipLoader";
import useAuthStore from "../store/useAuthStore";

const MyOrders = () => {
  const { orders, fetchUserOrders, loading } = useOrderStore();
  const { userId, logout } = useAuthStore();

  useEffect(() => {
    if (userId) {
      fetchUserOrders();
    } else {
      logout();
    }
  }, [userId]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <ClipLoader size={50} color="#FACC15" />
      </div>
    );

  const sortedOrders = orders?.sort((a, b) =>
    a.orderStatus === "delivered" && b.orderStatus !== "delivered" ? 1 : -1
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${assets.HeroSelectionBackground})` }}
    >
      <h2 className="text-4xl font-extrabold text-yellow-500 mb-8 text-center drop-shadow-lg">
        My Orders
      </h2>

      {sortedOrders?.length === 0 ? (
        <p className="text-center text-gray-400 text-lg">No orders found.</p>
      ) : (
        <div className="grid gap-8 w-full max-w-5xl">
          {sortedOrders.map((order) => (
            <div
              key={order._id}
              className="shadow-lg border border-gray-700 bg-gray-900 text-white p-6 rounded-lg hover:shadow-yellow-500 transition-shadow duration-300"
            >
              <div className="border-b border-gray-700 pb-3 mb-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Package className="text-yellow-500 w-6 h-6" />
                  <h3 className="text-2xl font-semibold">Order #{order._id.slice(-6)}</h3>
                </div>
                <span
                  className={`px-3 py-1 rounded-md text-sm font-semibold ${
                    order.orderStatus === "delivered"
                      ? "bg-green-600"
                      : order.orderStatus === "pending"
                      ? "bg-yellow-500"
                      : order.orderStatus === "shipped"
                      ? "bg-blue-500"
                      : "bg-gray-600"
                  }`}
                >
                  {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                {order.items.map((item, index) => (
                  <div
                    key={item?.product?._id || index}
                    className="flex items-center gap-4"
                  >
                    {item.product ? (
                      <>
                        <img
                          src={item.product?.image?.[0]}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-700"
                        />
                        <div>
                          <p className="text-xl font-semibold">{item.product.name}</p>
                          <p className="text-gray-400 text-sm">Quantity: {item.quantity}</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-red-400">
                        <p className="font-semibold">Product not found (may have been deleted)</p>
                        <p className="text-gray-400 text-sm">Quantity: {item.quantity}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <IndianRupee className="text-yellow-400 w-6 h-6" />
                  <p className="text-2xl font-bold">₹{order.totalAmount}</p>
                </div>
                <Link
                  to={`/orders/${order._id}`}
                  className="text-yellow-500 hover:underline font-semibold text-base"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
