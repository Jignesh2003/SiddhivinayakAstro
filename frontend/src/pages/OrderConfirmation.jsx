import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import confetti from "canvas-confetti";

const OrderConfirmation = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-6">
      <div className="max-w-lg bg-white shadow-xl rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-green-600">🎉 Order Placed Successfully!</h2>

        <p className="mt-3 text-gray-700 text-lg">
          Thank you for your purchase. Your order is now being processed.
        </p>

        {orderId ? (
          <p className="mt-2 text-gray-600 text-md">
            <span className="font-medium">Order ID:</span> {orderId}
          </p>
        ) : (
          <p className="mt-2 text-red-500 text-md">⚠️ Order ID not found</p>
        )}

        <div className="mt-6 flex gap-4 justify-center">
          <Link
            to="/my-orders"
            className="bg-yellow-500 text-white py-2 px-6 rounded-lg text-lg font-medium shadow-md transition duration-300 hover:bg-yellow-600"
          >
            View My Orders
          </Link>

          <Link
            to="/"
            className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg text-lg font-medium shadow-md transition duration-300 hover:bg-gray-300"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
