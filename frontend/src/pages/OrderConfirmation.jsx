import { Link } from "react-router-dom";
import { useEffect } from "react";
import confetti from "canvas-confetti";

const OrderConfirmation = () => {
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
        <Link
          to="/my-orders"
          className="mt-6 inline-block bg-yellow-500 text-white py-2 px-6 rounded-lg text-lg font-medium shadow-md transition duration-300 hover:bg-yellow-600"
        >
          View My Orders
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
