import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";

export default function Checkout() {
  const navigate = useNavigate();
  const { userId, token, logout } = useAuthStore.getState();
  const { cart, clearCart, fetchCart } = useCartStore.getState();

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

  // Load Cashfree payment SDK
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

  // ✅ Fetch live stock for each product
  const fetchLiveStock = async (productId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/products/${productId}`);
      return res.data;
    } catch (error) {
      console.error("❌ Failed to fetch live product:", productId, error);
      return null;
    }
  };

  // ✅ Validate inputs and live stock before order
  const validateInputs = async () => {
    if (!userId) throw new Error("User not logged in");
    if (!cart.length) throw new Error("Cart is empty");

    for (const [key, value] of Object.entries(shippingAddress)) {
      if (!value) throw new Error(`Please fill in ${key}`);
    }

    if (shippingAddress.phone.length !== 10) {
      throw new Error("Phone number must be 10 digits");
    }

    // Validate each cart item against fresh product stock
    for (const item of cart) {
      const quantity = Number(item.quantity ?? 1);
      const product = await fetchLiveStock(item.product._id);
      if (!product) throw new Error(`Failed to verify "${item.product.name}"`);

      let available = 0;

      if (product.sizeType !== "Quantity" && item.size) {
        const variant = product.stock.find(v => v.size === item.size);
        available = variant ? Number(variant.quantity) : 0;
      } else {
        available = Array.isArray(product.stock)
          ? product.stock.reduce((sum, s) => sum + Number(s.quantity || 0), 0)
          : Number(product.stock?.quantity ?? 0);
      }

      console.log(`Validating: ${product.name}, want ${quantity}, available ${available}`);

      if (!Number.isFinite(quantity) || quantity < 1)
        throw new Error(
          `Cart item "${product.name}" has invalid quantity (${item.quantity})`
        );
      if (quantity > available) {
        throw new Error(`Only ${available} left of "${product.name}"`);
      }
    }
  };

  const handleOrderSubmit = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await fetchCart(); // Ensure cart is refreshed
      await validateInputs(); // ❗ Live product validation

      const totalAmount = cart.reduce(
        (sum, item) => sum + item.product.price * Number(item.quantity ?? 1),
        0
      );

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
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        toast.success("✅ Order placed with Cash on Delivery!");
        clearCart();
        navigate(`/cod-confirmation?order_id=${data.order._id}&paymentStatus=${data.paymentStatus}`);
        return;
      }

      // ✅ Online Payment (Cashfree)
      if (!cashfreeInstance) throw new Error("Cashfree SDK not ready");

      const cfRes = await axios.post(
        `${import.meta.env.VITE_PAYMENT_URL}/cashfree/create-order`,
        {
          amount: totalAmount,
          shippingAddress,
          items: orderItems,
        },
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );

      const { payment_session_id } = cfRes.data;
      if (!payment_session_id) throw new Error("No payment session ID received");

      cashfreeInstance.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_self",
      });

    } catch (err) {
      console.error("❌ Checkout error:", err);
      toast.error(err?.response?.data?.message || err.message || "Checkout failed.");
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
          /> Cash on Delivery
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={selectedMethod === "online"}
            onChange={() => setSelectedMethod("online")}
          /> UPI / Card (via Cashfree)
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
