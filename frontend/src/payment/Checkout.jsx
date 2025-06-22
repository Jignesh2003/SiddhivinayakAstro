import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";

export default function Checkout() {
  const navigate = useNavigate();
  const { userId, token,logout } = useAuthStore.getState();
  const { cart, clearCart } = useCartStore.getState();

  const [selectedMethod, setSelectedMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  const handleChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value,
    });
  };

  const handleOrderSubmit = async () => {
    if (loading) return;
    setLoading(true);

    // 1. Basic user/cart validation
    if (!userId) {
      toast.error("User not logged in! Please log in.");
      logout()
      setLoading(false);
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty! Add items before placing an order.");
      setLoading(false);
      return;
    }

    // 2. Shipping fields validation
    for (const field of Object.keys(shippingAddress)) {
      if (!shippingAddress[field]) {
        toast.error(`Please fill in ${field}!`);
        setLoading(false);
        return;
      }
    }
    if (shippingAddress.phone.length !== 10) {
      toast.error("Invalid phone number. Must be 10 digits.");
      setLoading(false);
      return;
    }

    // 3. **NEW**: Verify against real stock before calling API
    for (const item of cart) {
      // If you later support multiple sizes, find the matching stock entry:
      // const entry = item.product.stock.find(s => s.size === item.size);
      // const available = entry?.quantity ?? 0;
      const available = item.product?.stock?.[0]?.quantity ?? 0;

      if (item.quantity > available) {
        toast.error(
          `Cannot place order: only ${available} left of "${item.product.name}".`,
          { position: "top-right" }
        );
        setLoading(false);
        return;
      }
    }

    // 4. Build order payload
    const orderData = {
      user: userId,
      items: cart.map((item) => ({
        product: item.product?._id,
        quantity: item.quantity,
      })),
      totalAmount: cart.reduce(
        (sum, item) => sum + (item.product?.price || 0) * item.quantity,
        0
      ),
      paymentMethod: selectedMethod,
      paymentStatus: selectedMethod === "cod" ? "Pending" : "Paid",
      orderStatus: "Pending",
      shippingAddress,
    };

    // 5. Send to back-end
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/place-order`,
        orderData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      toast.success("Order placed successfully! 🎉");
      clearCart();
      navigate("/order-confirmation");
    } catch (error) {
      console.error("Order submission failed:", error);
      const msg =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(msg, { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-5">Checkout</h2>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Enter Shipping Details</h3>
        {Object.keys(shippingAddress).map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={
              field.charAt(0).toUpperCase() + field.slice(1)
            }
            value={shippingAddress[field]}
            onChange={handleChange}
            className="w-full border p-2 rounded-md"
          />
        ))}
      </div>

      <div className="space-y-2 mt-4">
        <h3 className="font-semibold text-lg">Choose Payment Method</h3>
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id="cod"
            name="paymentMethod"
            value="cod"
            checked={selectedMethod === "cod"}
            onChange={() => setSelectedMethod("cod")}
          />
          <label htmlFor="cod">Cash on Delivery (COD)</label>
        </div>
        {/* add other methods here when needed */}
      </div>

      <button
        onClick={handleOrderSubmit}
        disabled={loading}
        className={`mt-4 py-2 px-6 w-full rounded ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-yellow-500 hover:bg-yellow-600 text-white"
        }`}
      >
        {loading ? "Placing Order..." : "Place Order"}
      </button>
    </div>
  );
}
