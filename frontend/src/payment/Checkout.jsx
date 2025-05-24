import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";

export default function Checkout() {
  const navigate = useNavigate();
  const { userId, token } = useAuthStore.getState();
  const { cart, clearCart } = useCartStore.getState();
  const [selectedMethod, setSelectedMethod] = useState("cod");
  const [loading, setLoading] = useState(false); // Prevent multiple submissions
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
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleOrderSubmit = async () => {
    if (loading) return; // Prevent duplicate requests
    setLoading(true); // Set loading to true when request starts

    if (!userId) {
      toast.error("User not logged in! Please log in.");
      setLoading(false);
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty! Add items before placing an order.");
      setLoading(false);
      return;
    }

    for (const field in shippingAddress) {
      if (!shippingAddress[field]) {
        toast.error(`Please fill in ${field} field!`);
        setLoading(false);
        return;
      }
    }

    if (shippingAddress.phone.length !== 10) {
      toast.error("Invalid phone number. Must be 10 digits.");
      setLoading(false);
      return;
    }

    const orderData = {
      user: userId,
      items: cart.map((item) => ({
        product: item.product?._id,
        quantity: item.quantity,
      })),
      totalAmount: cart.reduce((acc, item) => {
        return acc + (item.product?.price || 0) * item.quantity;
      }, 0),
      paymentMethod: selectedMethod,
      paymentStatus: selectedMethod === "cod" ? "pending" : "paid",
      orderStatus: "pending",
      shippingAddress,
    };

    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/place-order`, orderData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      toast.success("Order placed successfully! 🎉");
      clearCart();
      navigate("/order-confirmation");
    } catch (error) {
      console.error("Order submission failed:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false); // Reset loading state after request completes
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
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
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
      </div>

      <button
        onClick={handleOrderSubmit}
        disabled={loading} // Disable button while submitting
        className={`mt-4 py-2 px-6 w-full rounded ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}
      >
        {loading ? "Placing Order..." : "Place Order"}
      </button>
    </div>
  );
}
