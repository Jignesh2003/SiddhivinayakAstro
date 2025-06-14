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
      console.log("Fetching orders for user:", userId);
      fetchUserOrders();
    } else {
      logout();
      console.log("User ID not found, cannot fetch orders.");
    }
  }, [userId]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <ClipLoader size={50} color="#FACC15" />
      </div>
    );

  const sortedOrders = orders?.sort((a, b) =>
    a.orderStatus === "delivered" && b.orderStatus !== "delivered" ? 1 : -1
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6 bg-cover bg-center"
      style={{
        backgroundImage: `url(${assets.HeroSelectionBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <h2 className="text-3xl font-bold text-yellow-500 mb-6 text-center">My Orders</h2>

      {sortedOrders?.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No orders found.</p>
      ) : (
        <div className="grid gap-6 w-full max-w-4xl">
          {sortedOrders.map((order) => (
            <div
              key={order._id}
              className="shadow-lg border border-gray-700 bg-gray-900 text-white p-5 rounded-lg"
            >
              <div className="border-b border-gray-700 pb-3 mb-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Package className="text-yellow-500 w-6 h-6" />
                  <h3 className="text-xl font-semibold">Order #{order._id.slice(-6)}</h3>
                </div>
                <span
                  className={`px-3 py-1 rounded-md text-sm text-white ${
                    order.orderStatus === "delivered"
                      ? "bg-green-600"
                      : order.orderStatus === "pending"
                      ? "bg-yellow-500"
                      : order.orderStatus === "shipped"
                      ? "bg-blue-500"
                      : "bg-gray-500"
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>

              {/* Display Product Details */}
              <div className="space-y-3 mb-4">
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
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <p className="text-lg font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-red-400">
                        <p className="font-medium">Product not found (may have been deleted)</p>
                        <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <IndianRupee className="text-yellow-400 w-5 h-5" />
                  <p className="text-lg font-medium">₹{order.totalAmount}</p>
                </div>
                <Link
                  to={`/orders/${order._id}`}
                  className="text-yellow-500 hover:underline text-sm font-medium"
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
