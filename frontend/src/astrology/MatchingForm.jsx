import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { Globe, User, ArrowRight, MapPin } from "lucide-react";
import { Country, State, City } from "country-state-city";
import axios from "axios";
import useAuthStore from "@/store/useAuthStore";

export default function MatchForm() {
  const { token } = useAuthStore.getState();
  const navigate = useNavigate();

  // Common
  const [ayanamsa, setAyanamsa] = useState("1");
  const [la, setLa] = useState("en");

  // Girl's info
  const [girlDob, setGirlDob] = useState("");
  const [girlCountry, setGirlCountry] = useState("");
  const [girlState, setGirlState] = useState("");
  const [girlCity, setGirlCity] = useState("");
  const [girlCoords, setGirlCoords] = useState("");
  const [girlStates, setGirlStates] = useState([]);
  const [girlCities, setGirlCities] = useState([]);

  // Boy's info
  const [boyDob, setBoyDob] = useState("");
  const [boyCountry, setBoyCountry] = useState("");
  const [boyState, setBoyState] = useState("");
  const [boyCity, setBoyCity] = useState("");
  const [boyCoords, setBoyCoords] = useState("");
  const [boyStates, setBoyStates] = useState([]);
  const [boyCities, setBoyCities] = useState([]);

  // Cashfree SDK + loading
  const [cashfreeInstance, setCashfreeInstance] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load Cashfree SDK once
  useEffect(() => {
    if (window.Cashfree) {
      setCashfreeInstance(window.Cashfree({ mode:`${import.meta.env.VITE_PROD}` }));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) {
        setCashfreeInstance(window.Cashfree({ mode:`${import.meta.env.VITE_PROD}` }));
      } else {
        toast.error("❌ Failed to initialize payment SDK");
      }
    };
    script.onerror = () => toast.error("❌ Failed to load Cashfree SDK");
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  // Load girl states/cities/coords
  useEffect(() => {
    if (!girlCountry) return;
    setGirlStates(State.getStatesOfCountry(girlCountry));
    setGirlState("");
    setGirlCity("");
    setGirlCities([]);
    setGirlCoords("");
  }, [girlCountry]);
  useEffect(() => {
    if (!girlState) return;
    setGirlCities(City.getCitiesOfState(girlCountry, girlState));
    setGirlCity("");
    setGirlCoords("");
  }, [girlState, girlCountry]);
  useEffect(() => {
    if (!girlCity) return;
    const c = girlCities.find((c) => c.name === girlCity);
    if (c) {
      const lat = parseFloat(c.latitude).toFixed(6);
      const lon = parseFloat(c.longitude).toFixed(6);
      setGirlCoords(`${lat},${lon}`);
    }
  }, [girlCity, girlCities]);

  // Load boy states/cities/coords
  useEffect(() => {
    if (!boyCountry) return;
    setBoyStates(State.getStatesOfCountry(boyCountry));
    setBoyState("");
    setBoyCity("");
    setBoyCities([]);
    setBoyCoords("");
  }, [boyCountry]);
  useEffect(() => {
    if (!boyState) return;
    setBoyCities(City.getCitiesOfState(boyCountry, boyState));
    setBoyCity("");
    setBoyCoords("");
  }, [boyState, boyCountry]);
  useEffect(() => {
    if (!boyCity) return;
    const c = boyCities.find((c) => c.name === boyCity);
    if (c) {
      const lat = parseFloat(c.latitude).toFixed(6);
      const lon = parseFloat(c.longitude).toFixed(6);
      setBoyCoords(`${lat},${lon}`);
    }
  }, [boyCity, boyCities]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !ayanamsa ||
      !girlDob ||
      !girlCoords ||
      !boyDob ||
      !boyCoords
    ) {
      return toast.error(
        "Please complete all fields and select cities to auto‑fill coordinates"
      );
    }

    // Helper to append seconds + timezone
    const formatISO = (dt) => `${dt}:00+05:30`;

    const isoGirl = formatISO(girlDob);
    const isoBoy = formatISO(boyDob);

    const body = {
      ayanamsa,
      la,
      girl_coordinates: girlCoords,
      girl_dob: isoGirl,
      boy_coordinates: boyCoords,
      boy_dob: isoBoy,
    };

    if (!cashfreeInstance) {
      toast.error("Payment environment not ready. Please wait a moment.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PAYMENT_URL}/premium/kundli/matching`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { orderId, paymentSessionId } = response.data;

      if (!orderId || !paymentSessionId) {
        toast.error("Payment initiation failed: no session returned.");
        setLoading(false);
        return;
      }

      // Store matching params for fetching results after payment
      const matchingParams = {
        ayanamsa,
        girl_dob: isoGirl,
        girl_coordinates: girlCoords,
        boy_dob: isoBoy,
        boy_coordinates: boyCoords,
        la
      };

      cashfreeInstance.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: "_self",
        onSuccess: async function () {
          toast.success("Payment successful! Calculating result...");
          try {
            // Fetch matching results after successful payment
            const params = new URLSearchParams(matchingParams).toString();
            const matchResponse = await axios.get(
              `${import.meta.env.VITE_ASTROLOGY_URL}/kundali-matching/detailed?${params}`
            );
            setLoading(false);
            navigate("/matching-kundli-result", {
              state: { result: matchResponse.data }
            });
          } catch (error) {
            setLoading(false);
            toast.error("Failed to fetch matching results. Please refresh the page.");
            console.error(error);
          }
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
      setLoading(false);
      toast.error(error?.response?.data?.message || "Payment initiation failed!");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-6">
      <Toaster />
      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8 space-y-6 w-full max-w-lg "
      >
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">
          Kundli Compatibility
        </h1>

        {/* Ayanamsa & Language */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Ayanamsa</label>
            <select
              value={ayanamsa}
              onChange={(e) => setAyanamsa(e.target.value)}
              className="w-full p-2 bg-white bg-opacity-20 rounded"
            >
              <option value="1"> Lahiri</option>
              <option value="3"> Raman</option>
              <option value="5"> KP</option>
            </select>
          </div>
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
        </div>

        {/* Girl's DOB */}
        <div>
          <label className=" mb-1 flex items-center gap-1">
            <User /> Girl's DOB
          </label>
          <input
            type="datetime-local"
            value={girlDob}
            onChange={(e) => setGirlDob(e.target.value)}
            required
            className="w-full p-2 bg-white bg-opacity-20 rounded"
          />
        </div>

        {/* Girl's Location */}
        <div className="grid grid-cols-3 gap-3">
          <select
            value={girlCountry}
            onChange={(e) => setGirlCountry(e.target.value)}
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
            value={girlState}
            onChange={(e) => setGirlState(e.target.value)}
            disabled={!girlStates.length}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">State</option>
            {girlStates.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={girlCity}
            onChange={(e) => setGirlCity(e.target.value)}
            disabled={!girlCities.length}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">City</option>
            {girlCities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label className=" mb-1 flex items-center gap-1">
            <Globe /> Girl's Coordinates
          </label>
          <input
            type="text"
            value={girlCoords}
            readOnly
            className="w-full p-2 bg-white bg-opacity-20 rounded pr-10"
          />
          <MapPin className="absolute right-2 top-10 text-yellow-400" />
        </div>

        {/* Boy's DOB */}
        <div>
          <label className=" mb-1 flex items-center gap-1">
            <User /> Boy's DOB
          </label>
          <input
            type="datetime-local"
            value={boyDob}
            onChange={(e) => setBoyDob(e.target.value)}
            required
            className="w-full p-2 bg-white bg-opacity-20 rounded"
          />
        </div>

        {/* Boy's Location */}
        <div className="grid grid-cols-3 gap-3">
          <select
            value={boyCountry}
            onChange={(e) => setBoyCountry(e.target.value)}
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
            value={boyState}
            onChange={(e) => setBoyState(e.target.value)}
            disabled={!boyStates.length}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">State</option>
            {boyStates.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={boyCity}
            onChange={(e) => setBoyCity(e.target.value)}
            disabled={!boyCities.length}
            className="p-2 bg-white bg-opacity-20 rounded"
          >
            <option value="">City</option>
            {boyCities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label className=" mb-1 flex items-center gap-1">
            <Globe /> Boy's Coordinates
          </label>
          <input
            type="text"
            value={boyCoords}
            readOnly
            className="w-full p-2 bg-white bg-opacity-20 rounded pr-10"
          />
          <MapPin className="absolute right-2 top-10 text-yellow-400" />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-yellow-500 hover:bg-yellow-600 transition rounded py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={loading}
        >
          <ArrowRight className="h-5 w-5" />
          {loading ? "Processing..." : "Check Compatibility & Pay"}
        </button>
      </form>
    </div>
  );
}