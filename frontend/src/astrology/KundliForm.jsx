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
  const [time, setTime] = useState(""); // "HH:mm"
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [ayanamsa, setAyanamsa] = useState("1");
  const [language, setLanguage] = useState("en");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cashfreeInstance, setCashfreeInstance] = useState(null);
  const { token } = useAuthStore();

  // User info fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  const pad2 = (n) => n.toString().padStart(2, "0");

  const buildDatetime = () => {
    if (!day || !month || !year || !time) return "";
    return `${year}-${pad2(month)}-${pad2(day)}T${time}:00+05:30`;
  };

  const buildLocation = () => {
    const country = Country.getAllCountries().find((c) => c.isoCode === countryCode)?.name;
    const state = states.find((s) => s.isoCode === stateCode)?.name;
    return cityName && state && country ? `${cityName}, ${state}, ${country}` : "";
  };

  // Load states when country changes
  useEffect(() => {
    if (!countryCode) return;
    setStates(State.getStatesOfCountry(countryCode));
    setStateCode("");
    setCities([]);
    setCityName("");
    setCoordinates("");
  }, [countryCode]);

  // Load cities when state changes
  useEffect(() => {
    if (!stateCode) return;
    setCities(City.getCitiesOfState(countryCode, stateCode));
    setCityName("");
    setCoordinates("");
  }, [stateCode]);

  // Update coordinates when city changes
  useEffect(() => {
    if (!cityName) return;
    const selectedCity = cities.find((c) => c.name === cityName);
    if (selectedCity) setCoordinates(`${selectedCity.latitude},${selectedCity.longitude}`);
  }, [cityName, cities]);

  // Load Cashfree SDK on component mount
  useEffect(() => {
    if (window.cashfree) {
      setCashfreeInstance(window.cashfree);  // SDK available globally
      return;
    }

    const script = document.createElement("script");
    // Use sandbox or production URL as needed
    script.src = "https://sdk.cashfree.com/js/cashfree.browser.production.min.js";
    script.async = true;

    script.onload = () => {
      if (window.cashfree) {
        setCashfreeInstance(window.cashfree);
      } else {
        toast.error("Failed to initialize Cashfree payment SDK.");
      }
    };

    script.onerror = () => {
      toast.error("Failed to load Cashfree payment SDK.");
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Handle input changes for shipping info and others
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "cityName") {
      setCoordinates("");
    }
    if (name === "fullName") setFullName(value);
    else if (name === "email") setEmail(value);
    else if (name === "day") setDay(value);
    else if (name === "month") setMonth(value);
    else if (name === "year") setYear(value);
    else if (name === "time") setTime(value);
    else if (name === "countryCode") setCountryCode(value);
    else if (name === "stateCode") setStateCode(value);
    else if (name === "cityName") setCityName(value);
    else if (name === "ayanamsa") setAyanamsa(value);
    else if (name === "language") setLanguage(value);
  };

  const handleSubmit = async () => {
    const datetime = buildDatetime();
    const location = buildLocation();

    if (!datetime || !coordinates || !location || !fullName.trim() || !email.trim()) {
      toast.error("Please fill all required fields.");
      return;
    }

    // Optionally validate email format here

    if (!cashfreeInstance || !cashfreeInstance.payment) {
      toast.error("Payment environment is not ready. Please try again later.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PAYMENT_URL}/premium/ kundli`,
        {
          amount: 599,
          customerName: fullName,
          customerEmail: email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      // Launch payment popup
      cashfreeInstance.payment.launchPopup({
        orderId: data.orderId,
        orderAmount: "599",
        customerName: fullName,
        customerEmail: email,
        token: data.token,
        tokenType: "TXN_TOKEN",
        stage: "PROD",
        onSuccess: () => {
          toast.success("Payment successful! Redirecting...");
          setTimeout(() => {
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
          }, 1000);
        },
        onFailure: () => {
          toast.error("Payment failed. Please try again.");
          setLoading(false);
        },
        onDismiss: () => {
          toast("Payment cancelled.");
          setLoading(false);
        },
      });
    } catch (error) {
      setLoading(false);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message || "Something went wrong");
      }
      console.error(error);
    }
  };

  // Date arrays for dropdowns
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-black text-white py-10">
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <h1 className="text-3xl font-bold text-center text-yellow-400">
          Detailed Kundli Generator
        </h1>

        {/* Ayanamsa info */}
        <div className="bg-gray-800 p-4 rounded text-sm space-y-1">
          <p>
            <strong>Ayanamsa</strong> sets the zodiac offset:
          </p>
          <ul className="list-disc list-inside">
            <li>Lahiri – Official Indian standard</li>
            <li>Raman – G.K. Ojha’s method</li>
            <li>KP – Krishnamurti Paddhati</li>
          </ul>
        </div>

        {/* User info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            name="fullName"
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={handleChange}
            className="bg-gray-800 rounded p-2"
            autoComplete="name"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleChange}
            className="bg-gray-800 rounded p-2"
            autoComplete="email"
          />
        </div>

        {/* Date selectors */}
        <div className="grid grid-cols-3 gap-4">
          <select name="day" value={day} onChange={handleChange} className="bg-gray-800 rounded p-2">
            <option value="">Day</option>
            {days.map((d) => (
              <option key={d} value={pad2(d)}>
                {pad2(d)}
              </option>
            ))}
          </select>
          <select name="month" value={month} onChange={handleChange} className="bg-gray-800 rounded p-2">
            <option value="">Month</option>
            {months.map((m) => (
              <option key={m} value={pad2(m)}>
                {pad2(m)}
              </option>
            ))}
          </select>
          <select name="year" value={year} onChange={handleChange} className="bg-gray-800 rounded p-2">
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Time */}
        <input
          name="time"
          type="time"
          value={time}
          onChange={handleChange}
          className="bg-gray-800 rounded p-2 w-full"
        />

        {/* Location selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select name="countryCode" value={countryCode} onChange={handleChange} className="bg-gray-800 rounded p-2">
            <option value="">Country</option>
            {Country.getAllCountries().map((c) => (
              <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
            ))}
          </select>
          <select name="stateCode" value={stateCode} onChange={handleChange} disabled={!states.length} className="bg-gray-800 rounded p-2">
            <option value="">State</option>
            {states.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
            ))}
          </select>
          <select name="cityName" value={cityName} onChange={handleChange} disabled={!cities.length} className="bg-gray-800 rounded p-2">
            <option value="">City</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Coordinates (read-only) */}
        <input
          name="coordinates"
          type="text"
          value={coordinates}
          readOnly
          placeholder="Latitude,Longitude"
          className="bg-gray-800 rounded p-2 w-full"
        />

        {/* Ayanamsa and language */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <select name="ayanamsa" value={ayanamsa} onChange={handleChange} className="bg-gray-800 rounded p-2">
            <option value="1">Lahiri</option>
            <option value="3">Raman</option>
            <option value="5">KP</option>
          </select>
          <select name="language" value={language} onChange={handleChange} className="bg-gray-800 rounded p-2">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full mt-6 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            "Generate"
          )}
        </Button>
      </div>
    </div>
  );
}
