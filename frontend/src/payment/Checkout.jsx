import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import { Country, State, City } from "country-state-city";

export default function Checkout() {
  const { userId, token, logout } = useAuthStore.getState();
  const { cart, clearCart, fetchCart } = useCartStore.getState();

  const [selectedMethod, setSelectedMethod] = useState(""); // no default, must be explicitly chosen
  const [loading, setLoading] = useState(false);
  const [cashfreeInstance, setCashfreeInstance] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    landmark: "",
  });

  // To hold dropdown options
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  // Load Cashfree payment SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) {
        const instance = window.Cashfree({ mode:`${import.meta.env.VITE_PROD}` });
        setCashfreeInstance(instance);
        console.log(instance);
        
      } else {
        toast.error("❌ Failed to initialize Cashfree");
      }
    };
    script.onerror = () => toast.error("❌ Failed to load Cashfree SDK");
    document.body.appendChild(script);
  }, []);

  // Load countries on mount
  useEffect(() => {
    const countries = Country.getAllCountries();
    setCountryOptions(countries);
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (shippingAddress.country) {
      const states = State.getStatesOfCountry(shippingAddress.country);
      setStateOptions(states);
      setShippingAddress((prev) => ({
        ...prev,
        state: "",
        city: "",
      }));
      setCityOptions([]);
    } else {
      setStateOptions([]);
      setCityOptions([]);
    }
  }, [shippingAddress.country]);

  // Load cities when state changes
  useEffect(() => {
    if (shippingAddress.country && shippingAddress.state) {
      const cities = City.getCitiesOfState(
        shippingAddress.country,
        shippingAddress.state
      );
      setCityOptions(cities);
      setShippingAddress((prev) => ({
        ...prev,
        city: "",
      }));
    } else {
      setCityOptions([]);
    }
  }, [shippingAddress.state, shippingAddress.country]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Fetch live stock for each product
  const fetchLiveStock = async (productId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/products/${productId}`
      );
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
        const variant = product.stock.find((v) => v.size === item.size);
        available = variant ? Number(variant.quantity) : 0;
      } else {
        available = Array.isArray(product.stock)
          ? product.stock.reduce((sum, s) => sum + Number(s.quantity || 0), 0)
          : Number(product.stock?.quantity ?? 0);
      }

      if (!Number.isFinite(quantity) || quantity < 1)
        throw new Error(
          `Cart item "${product.name}" has invalid quantity (${item.quantity})`
        );
      if (quantity > available) {
        throw new Error(`Only ${available} left of "${product.name}"`);
      }
    }

    // Require the online payment method selection
    if (!selectedMethod) {
      throw new Error("Please select a payment method");
    }
  };

  const handleOrderSubmit = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await fetchCart();
      await validateInputs();

      const subTotal = cart.reduce(
        (sum, item) => sum + item.product.price * Number(item.quantity ?? 1),
        0
      );

      const gstAmount = Number(((subTotal * 18) / 118).toFixed(2));
      const deliveryCharges = subTotal > 499 ? 0 : 100;

      const orderItems = cart.map((item) => ({
        product: item.product._id,
        quantity: Number(item.quantity ?? 1),
        ...(item.size && { size: item.size }),
      }));

      // ✅ Online Payment (Cashfree)
      if (!cashfreeInstance) throw new Error("Cashfree SDK not ready");

      const cfRes = await axios.post(
        `${import.meta.env.VITE_PAYMENT_URL}/cashfree/create-order`,
        {
          amount: subTotal,
          gstAmount,
          deliveryCharges,
          shippingAddress,
          items: orderItems,
          paymentMethod: "online", // force online payment
        },
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );

      const { payment_session_id } = cfRes.data;

      if (!payment_session_id)
        throw new Error("No payment session ID received");

      cashfreeInstance.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_self",
      });
      console.log(payment_session_id);

    } catch (err) {
      console.error("❌ Checkout error:", err);
      toast.error(
        err?.response?.data?.message || err.message || "Checkout failed."
      );
      if (err.message && err.message.includes("not logged in")) logout();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Compute subtotal, gst, deliveryCharges for UI summary
  const subTotal = cart.reduce(
    (sum, item) => sum + item.product.price * Number(item.quantity ?? 1),
    0
  );
  const gstAmount = Number(((subTotal * 18) / 118).toFixed(2));
  const deliveryCharges = subTotal > 499 ? 0 : 100;
  const total = subTotal + deliveryCharges;
console.log(`Is production? ${import.meta.env.VITE_PROD}`);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-5">Checkout</h2>

      {/* Shipping details */}
      <div className="space-y-3">
        <h3 className="font-semibold">Shipping Details</h3>

        <input
          name="name"
          placeholder="Name"
          value={shippingAddress.name}
          onChange={handleChange}
          className="w-full border p-2 rounded-md mb-2"
          autoComplete="off"
        />

        <input
          name="phone"
          placeholder="Phone"
          value={shippingAddress.phone}
          onChange={handleChange}
          className="w-full border p-2 rounded-md mb-2"
          autoComplete="off"
          maxLength={10}
          type="tel"
        />

        <input
          name="address"
          placeholder="Address"
          value={shippingAddress.address}
          onChange={handleChange}
          className="w-full border p-2 rounded-md mb-2"
          autoComplete="off"
        />

        {/* Country dropdown */}
        <select
          name="country"
          value={shippingAddress.country}
          onChange={handleChange}
          className="w-full border p-2 rounded-md mb-2 bg-white"
          required
        >
          <option value="">Select Country</option>
          {countryOptions.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.name}
            </option>
          ))}
        </select>

        {/* State dropdown */}
        <select
          name="state"
          value={shippingAddress.state}
          onChange={handleChange}
          className="w-full border p-2 rounded-md mb-2 bg-white"
          required
          disabled={!stateOptions.length}
        >
          <option value="">Select State</option>
          {stateOptions.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>
              {s.name}
            </option>
          ))}
        </select>

        {/* City dropdown */}
        <select
          name="city"
          value={shippingAddress.city}
          onChange={handleChange}
          className="w-full border p-2 rounded-md mb-2 bg-white"
          required
          disabled={!cityOptions.length}
        >
          <option value="">Select City</option>
          {cityOptions.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          name="pincode"
          placeholder="Pincode"
          value={shippingAddress.pincode}
          onChange={handleChange}
          className="w-full border p-2 rounded-md mb-2"
          autoComplete="off"
          type="text"
        />

        <input
          name="landmark"
          placeholder="Landmark"
          value={shippingAddress.landmark}
          onChange={handleChange}
          className="w-full border p-2 rounded-md mb-2"
          autoComplete="off"
        />
      </div>

      {/* Payment Method */}
      <div className="mt-4 space-y-2">
        <h3 className="font-semibold">Payment Method</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="paymentMethod"
            checked={selectedMethod === "online"}
            onChange={() => setSelectedMethod("online")}
            required
          />{" "}
          UPI / Card (via Cashfree)
        </label>
      </div>

      {/* Order Summary */}
      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold mb-2">Order Summary</h3>
        <div className="space-y-1">
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between text-sm border-b py-1">
              <span>
                {item.product.name} (x{item.quantity ?? 1})
              </span>
              <span>₹{item.product.price * Number(item.quantity ?? 1)}</span>
            </div>
          ))}

          <div className="flex justify-between text-sm mt-2">
            <span>Subtotal</span>
            <span>₹{subTotal}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Delivery Charges</span>
            <span>
              {deliveryCharges === 0 ? "Free" : `₹${deliveryCharges}`}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span>GST (included in price)</span>
            <span>₹{gstAmount}</span>
          </div>

          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>
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
