import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Country, State, City } from "country-state-city";
import axios from "axios";
import useAuthStore from "@/store/useAuthStore";

export default function KundliForm() {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [time, setTime] = useState(""); // HH:mm
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [ayanamsa, setAyanamsa] = useState("1");
  const [language, setLanguage] = useState("en");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  // User fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  const pad2 = (n) => n.toString().padStart(2, "0");

  // Compose ISO datetime string for API
  const buildDatetime = () => {
    if (!day || !month || !year || !time) return "";
    return `${year}-${pad2(month)}-${pad2(day)}T${time}:00+05:30`;
  };

  // Compose location string for API
  const buildLocation = () => {
    const country = Country.getAllCountries().find((c) => c.isoCode === countryCode)?.name;
    const state = states.find((s) => s.isoCode === stateCode)?.name;
    return cityName && state && country ? `${cityName}, ${state}, ${country}` : "";
  };

  // Load states on country change
  useEffect(() => {
    if (!countryCode) return;
    setStates(State.getStatesOfCountry(countryCode));
    setStateCode("");
    setCities([]);
    setCityName("");
    setCoordinates("");
  }, [countryCode]);

  // Load cities on state change
  useEffect(() => {
    if (!stateCode) return;
    setCities(City.getCitiesOfState(countryCode, stateCode));
    setCityName("");
    setCoordinates("");
  }, [stateCode]);

  // Update coordinates on city change
  useEffect(() => {
    if (!cityName) return;
    const selectedCity = cities.find((c) => c.name === cityName);
    if (selectedCity) setCoordinates(`${selectedCity.latitude},${selectedCity.longitude}`);
  }, [cityName, cities]);

  // Load Cashfree SDK once on mount
  useEffect(() => {
    if (window.cashfree) return; // already loaded

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/cashfree.browser.production.min.js"; // Use production or sandbox based on environment
    script.async = true;

    script.onload = () => {
      if (window.cashfree) {
        // No need to instantiate here; window.cashfree is a singleton
        console.log("Cashfree SDK initialized");
      } else {
        toast.error("Failed to initialize Cashfree payment SDK.");
      }
    };

    script.onerror = () => {
      toast.error("Failed to load Cashfree payment SDK.");
    };

    document.body.appendChild(script);

    // Cleanup on unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCoordinates(prev => (name === "cityName" && value) ? "" : prev); // Reset coordinates when city changes
    if (name in shippingFields) {
      setShippingFields(prev => ({ ...prev, [name]: value }));
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    const datetime = buildDatetime();
    const location = buildLocation();

    if (!datetime || !coordinates || !location || !fullName.trim() || !email.trim()) {
      toast.error("Please fill all fields.");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // Create order on backend
      const response = await axios.post(
        `${import.meta.env.VITE_PAYMENT_URL}/premium/kundli`,
        {
          amount: 599, // hardcoded minimum price, or calculate from UI if needed
          customerName: fullName,
          customerEmail: email,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;

      // Check that Cashfree SDK is ready
      if (typeof window.cashfree === "undefined" || !window.cashfree?.payment) {
        toast.error("Payment environment not ready. Please reload and try again.");
        setLoading(false);
        return;
      }

      // Launch Cashfree payment popup
      window.cashfree.payment.launchPopup({
        orderId: data.orderId,
        orderAmount: "599",
        customerName: fullName,
        customerEmail: email,
        token: data.token,
        tokenType: "TXN_TOKEN",
        stage: "PROD", // Change "sandbox" if needed
        onSuccess: () => {
          toast.success("Payment successful! Redirecting...");
          setLoading(false);
          const q = new URLSearchParams({
            datetime,
            coordinates,
            location,
            ayanamsa,
            la: language,
            year_length: "1",
          }).toString();
          navigate(`/kundli-result?${q}`);
        },
        onFailure: () => {
          toast.error("Payment failed, please try again.");
          setLoading(false);
        },
        onDismiss: () => {
          toast("Payment cancelled");
          setLoading(false);
        },
      });
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
      setLoading(false);
    }
  };

  // Arrays for date dropdowns
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-black text-white py-10">
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto space-y-6 px-4">
        <h1 className="text-3xl font-bold text-yellow-400 text-center">Detailed Kundli Generator</h1>

        {/* Ayanamsa Info */}
        <div className="bg-gray-800 p-4 rounded text-sm space-y-1">
          <p><strong>Ayanamsa</strong> sets the zodiac offset:</p>
          <ul className="list-disc list-inside">
            <li><strong>Lahiri</strong> – Official Indian standard</li>
            <li><strong>Raman</strong> – G.K. Ojha’s method</li>
            <li><strong>KP</strong> – Krishnamurti Paddhati</li>
          </ul>
        </div>

        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="fullName"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Full Name"
            className="bg-gray-800 p-2 rounded"
            autoComplete="name"
          />
          <input
            type="email"
            name="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="bg-gray-800 p-2 rounded"
            autoComplete="email"
          />
        </div>

        {/* Date fields */}
        <div className="grid grid-cols-3 gap-4">
          <select value={day} onChange={e => setDay(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option value="">Day</option>
            {days.map(d => (
              <option key={d} value={pad2(d)}>{pad2(d)}</option>
            ))}
          </select>
          <select value={month} onChange={e => setMonth(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option value="">Month</option>
            {months.map(m => (
              <option key={m} value={pad2(m)}>{pad2(m)}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option value="">Year</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Time */}
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="bg-gray-800 p-2 rounded w-full"
        />

        {/* Location selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option value="">Country</option>
            {Country.getAllCountries().map(c => (
              <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
            ))}
          </select>
          <select value={stateCode} onChange={e => setStateCode(e.target.value)} disabled={!states.length} className="bg-gray-800 p-2 rounded">
            <option value="">State</option>
            {states.map(s => (
              <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
            ))}
          </select>
          <select value={cityName} onChange={e => setCityName(e.target.value)} disabled={!cities.length} className="bg-gray-800 p-2 rounded">
            <option value="">City</option>
            {cities.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={coordinates}
          readOnly
          placeholder="Latitude,Longitude"
          className="bg-gray-800 p-2 rounded w-full"
        />

        {/* Ayanamsa and language */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <select value={ayanamsa} onChange={e => setAyanamsa(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option value="1">Lahiri</option>
            <option value="3">Raman</option>
            <option value="5">KP</option>
          </select>
          <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-gray-800 p-2 rounded">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full mt-6 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing…
            </>
          ) : (
            "Generate"
          )}
        </Button>
      </div>
    </div>
  );
}
