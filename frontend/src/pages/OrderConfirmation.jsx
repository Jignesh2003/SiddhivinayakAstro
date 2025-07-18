import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import confetti from "canvas-confetti";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const OrderConfirmation = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get("order_id");
  const queryStatus = searchParams.get("status")?.toUpperCase(); // from Cashfree redirect

  const { token } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState(queryStatus || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!orderId || !hydrated) return;

      // If user is not logged in, fallback to queryStatus only
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_PAYMENT_URL}/cashfree/check-status?order_id=${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (data?.status) {
          setStatus(data.status.toUpperCase());

          if (data.status === "PAID") {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        } else {
          setStatus("UNKNOWN");
        }
      } catch (err) {
        console.error("❌ Failed to fetch payment status:", err);
        setStatus("FAILED");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [orderId, token, hydrated]);

const isSuccess = ["PAID", "PENDING"].includes(status);
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-6">
      <div className="max-w-lg bg-white shadow-xl rounded-lg p-8 text-center">
        <h2
          className={`text-3xl font-bold ${
            isSuccess ? "text-green-600" : "text-red-600"
          }`}
        >
          {loading
            ? "Checking Payment Status..."
            : isSuccess
            ? "🎉 Payment Successful!"
            : status === "FAILED"
            ? "❌ Payment Failed"
            : status === "UNKNOWN"
            ? "⚠️ Unable to determine payment status"
            : `ℹ️ Payment Status: ${status}`}
        </h2>

        {!loading && (
          <>
            <p className="mt-3 text-gray-700 text-lg">
              {isSuccess
                ? "Thank you for your purchase. Your order is being processed."
                : "If you believe this is an error, please contact support."}
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
          </>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmation;
