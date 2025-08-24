import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Globe, MapPin, Calendar, ArrowRight } from "lucide-react";
import { Country, State, City } from "country-state-city";
import axios from "axios";
import useAuthStore from "@/store/useAuthStore";

export default function PanchangForm() {
  const { token } = useAuthStore.getState();
  const ayanamsa = "1";
  const [la, setLa] = useState("en");

  const [dateTime, setDateTime] = useState(""); // YYYY-MM-DDTHH:mm

  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [coords, setCoords] = useState("");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [cashfreeInstance, setCashfreeInstance] = useState(null);

  // Load states on country change
  useEffect(() => {
    if (!countryCode) return;
    setStates(State.getStatesOfCountry(countryCode));
    setStateCode("");
    setCityName("");
    setCities([]);
    setCoords("");
  }, [countryCode]);

  // Load cities on state change
  useEffect(() => {
    if (!stateCode) return;
    setCities(City.getCitiesOfState(countryCode, stateCode));
    setCityName("");
    setCoords("");
  }, [stateCode, countryCode]);

  // Auto-fill coords on city select
  useEffect(() => {
    if (!cityName) return;
    const selected = cities.find(c => c.name === cityName);
    if (selected) {
      const lat = parseFloat(selected.latitude).toFixed(6);
      const lon = parseFloat(selected.longitude).toFixed(6);
      setCoords(`${lat},${lon}`);
    }
  }, [cityName, cities]);

  // Load Cashfree SDK once
  useEffect(() => {
    if (window.Cashfree) {
      setCashfreeInstance(window.Cashfree({ mode: "production" }));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) {
        setCashfreeInstance(window.Cashfree({ mode: "production" }));
      } else {
        toast.error("❌ Failed to initialize payment SDK");
      }
    };
    script.onerror = () => toast.error("❌ Failed to load Cashfree SDK");
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dateTime || !coords) {
      return toast.error("Please fill date/time and select a city");
    }

    if (!cashfreeInstance) {
      return toast.error("Payment environment not ready. Please wait a moment.");
    }

    setLoading(true);

    try {
      const datetimeISO = `${dateTime}:00+05:30`;
      const body = {
        ayanamsa,
        coordinates: coords,
        datetime: datetimeISO,
        la,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_PAYMENT_URL}/premium/panchang`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
console.log(response);

      const { orderId, paymentSessionId } = response.data;

      if (!orderId || !paymentSessionId) {
        toast.error("Payment initiation failed: missing session info.");
        setLoading(false);
        return;
      }

      // Open Cashfree payment popup using the paymentSessionId
      cashfreeInstance.checkout({
        paymentSessionId, // This is the token from your backend
        redirectTarget: "_self",
        onSuccess: function () {
          toast.success("Payment successful! Redirecting...");
          // You can redirect or update UI here after success
        },
        onFailure: function () {
          toast.error("Payment failed. Please try again.");
          setLoading(false);
        },
        onDismiss: function () {
          toast("Payment cancelled.");
          setLoading(false);
        },
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong!");
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-teal-900 flex items-center justify-center p-6">
      <Toaster position="top-center" />
      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8 space-y-6 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-yellow-300 text-center">
          Detailed Panchang
        </h1>

        {/* Language */}
        <div>
          <label className="block mb-1">Language</label>
          <select
            value={la}
            onChange={(e) => setLa(e.target.value)}
            className="w-full p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>

        {/* Date & Time */}
        <div>
          <label className=" mb-1 flex items-center gap-1">
            <Calendar /> Date & Time
          </label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            required
            className="w-full p-2 bg-white bg-opacity-20 rounded"
          />
        </div>

        {/* Country/State/City */}
        <div className="grid grid-cols-3 gap-3">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">Country</option>
            {Country.getAllCountries().map((c) => (
              <option key={c.isoCode} value={c.isoCode}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            disabled={!states.length}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">State</option>
            {states.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            disabled={!cities.length}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">City</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Coordinates (read-only) */}
        <div className="relative">
          <label className=" mb-1 flex items-center gap-1">
            <Globe /> Coordinates
          </label>
          <input
            type="text"
            value={coords}
            readOnly
            placeholder="lat,lon"
            className="w-full p-2 bg-white bg-opacity-20 rounded pr-10"
          />
          <MapPin className="absolute right-2 top-[38px] text-yellow-300" />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-yellow-400 hover:bg-yellow-500 transition rounded py-3 flex items-center justify-center gap-2 font-semibold text-black disabled:opacity-50"
          disabled={loading}
        >
          <ArrowRight className="w-5 h-5" />
          {loading ? "Generating..." : "Generate Panchang"}
        </button>
      </form>
    </div>
  );
}
