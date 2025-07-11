import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import confetti from "canvas-confetti";

export const OrderConfirmation = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const orderId = searchParams.get("order_id");
  const status = searchParams.get("status"); // Get payment status

  useEffect(() => {
    if (status === "SUCCESS") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [status]);

  const isSuccess = status === "SUCCESS";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-6">
      <div className="max-w-lg bg-white shadow-xl rounded-lg p-8 text-center">
        <h2
          className={`text-3xl font-bold ${
            isSuccess ? "text-green-600" : "text-red-600"
          }`}
        >
          {isSuccess ? "🎉 Payment Successful!" : "❌ Payment Failed"}
        </h2>

        <p className="mt-3 text-gray-700 text-lg">
          {isSuccess
            ? "Thank you for your purchase. Your order is being processed."
            : "Something went wrong. Your payment was not successful."}
        </p>

        {orderId ? (
          <p className="mt-2 text-gray-600 text-md">
            <span className="font-medium">Order ID:</span> {orderId}
          </p>
        ) : (
          <p className="mt-2 text-red-500 text-md">⚠️ Order ID not found</p>
        )}

        <div className="mt-6 flex gap-4 justify-center">
          {isSuccess ? (
            <Link
              to="/my-orders"
              className="bg-yellow-500 text-white py-2 px-6 rounded-lg text-lg font-medium shadow-md transition duration-300 hover:bg-yellow-600"
            >
              View My Orders
            </Link>
          ) : (
            <Link
              to="/"
              className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg text-lg font-medium shadow-md transition duration-300 hover:bg-gray-300"
            >
              Try Again
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};