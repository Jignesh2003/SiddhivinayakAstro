import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";

export default function Checkout() {
  const navigate = useNavigate();
  const { userId, token, logout } = useAuthStore.getState();
  const { cart, clearCart } = useCartStore.getState();

  const [selectedMethod, setSelectedMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [cashfreeInstance, setCashfreeInstance] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) {
        const instance = window.Cashfree({ mode: "sandbox" });
        setCashfreeInstance(instance);
      } else {
        toast.error("❌ Failed to initialize Cashfree");
      }
    };
    script.onerror = () => toast.error("❌ Failed to load Cashfree SDK");
    document.body.appendChild(script);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const validateInputs = () => {
    if (!userId) throw new Error("User not logged in");
    if (!cart.length) throw new Error("Cart is empty");
    for (const [key, value] of Object.entries(shippingAddress)) {
      if (!value) throw new Error(`Please fill in ${key}`);
    }
    if (shippingAddress.phone.length !== 10) {
      throw new Error("Phone number must be 10 digits");
    }
    cart.forEach((item) => {
      const quantity = Number(item.quantity ?? 1);
      const available = Number(item.product?.stock?.[0]?.quantity ?? 0);
      if (!Number.isFinite(quantity) || quantity < 1)
        throw new Error(
          `Cart item "${item.product?.name}" has invalid quantity (${item.quantity})`
        );
      if (quantity > available) {
        throw new Error(`Only ${available} left of "${item.product?.name}"`);
      }
    });
  };

  const handleOrderSubmit = async () => {
    if (loading) return;
    setLoading(true);

    try {
      validateInputs();

      const totalAmount = cart.reduce(
        (sum, item) => sum + item.product.price * Number(item.quantity ?? 1),
        0
      );

      // Prepare sanitized order items with numbers only
      const orderItems = cart.map((item) => ({
        product: item.product._id,
        quantity: Number(item.quantity ?? 1),
        ...(item.size && { size: item.size }),
      }));

      if (selectedMethod === "cod") {
        const orderData = {
          user: userId,
          items: orderItems,
          totalAmount,
          paymentMethod: "cod",
          paymentStatus: "Pending",
          orderStatus: "Pending",
          shippingAddress,
        };

        const { data } = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/place-order`,
          orderData,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );

        toast.success("✅ Order placed with Cash on Delivery!");
        clearCart();
        navigate(
          `/cod-confirmation?order_id=${data.order._id}&paymentStatus=${data.paymentStatus}`
        );
        return;
      }

      // ONLINE PAYMENT
      if (!cashfreeInstance) throw new Error("Cashfree SDK not ready");

      const cfRes = await axios.post(
        `${import.meta.env.VITE_PAYMENT_URL}/cashfree/create-order`,
        {
          amount: totalAmount,
          shippingAddress,
          items: orderItems, // always numbers!
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      const { payment_session_id } = cfRes.data;
      if (!payment_session_id)
        throw new Error("No payment session ID received");

      cashfreeInstance.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_self", // Or "_blank"
      });

    } catch (err) {
      console.error("❌ Checkout error:", err);
      toast.error(
        err?.response?.data?.message ||
          err.message ||
          "Something went wrong"
      );
      if (err.message && err.message.includes("not logged in")) logout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-5">Checkout</h2>

      <div className="space-y-3">
        <h3 className="font-semibold">Shipping Details</h3>
        {Object.keys(shippingAddress).map((field) => (
          <input
            key={field}
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={shippingAddress[field]}
            onChange={handleChange}
            className="w-full border p-2 rounded-md mb-2"
            autoComplete="off"
          />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="font-semibold">Payment Method</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={selectedMethod === "cod"}
            onChange={() => setSelectedMethod("cod")}
          />
          Cash on Delivery
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={selectedMethod === "online"}
            onChange={() => setSelectedMethod("online")}
          />
          UPI / Card (via Cashfree)
        </label>
      </div>

      <button
        onClick={handleOrderSubmit}
        disabled={loading}
        className={`mt-4 w-full py-2 rounded ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-yellow-500 hover:bg-yellow-600 text-white"
        } font-bold transition`}
      >
        {loading ? "Processing…" : "Place Order"}
      </button>
    </div>
  );
}
