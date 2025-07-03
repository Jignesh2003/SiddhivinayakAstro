// src/pages/PanchangForm.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { Globe, MapPin, Calendar, ArrowRight } from "lucide-react";
import { Country, State, City } from "country-state-city";

export default function PanchangForm() {
  const navigate = useNavigate();

  // Ayanamsa & Language
  const [ayanamsa, setAyanamsa] = useState("1");
  const [la, setLa] = useState("en");

  // Date & Time
  const [dateTime, setDateTime] = useState(""); // "YYYY-MM-DDTHH:MM"

  // Location fields
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [coords, setCoords] = useState("");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Load states when country changes
  useEffect(() => {
    if (!countryCode) return;
    setStates(State.getStatesOfCountry(countryCode));
    setStateCode("");
    setCityName("");
    setCities([]);
    setCoords("");
  }, [countryCode]);

  // Load cities when state changes
  useEffect(() => {
    if (!stateCode) return;
    setCities(City.getCitiesOfState(countryCode, stateCode));
    setCityName("");
    setCoords("");
  }, [stateCode, countryCode]);

  // Auto‑fill coords when city chosen
  useEffect(() => {
    if (!cityName) return;
    const c = cities.find((c) => c.name === cityName);
    if (c) {
      const lat = parseFloat(c.latitude).toFixed(6);
      const lon = parseFloat(c.longitude).toFixed(6);
      setCoords(`${lat},${lon}`);
    }
  }, [cityName, cities]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ayanamsa || !dateTime || !coords) {
      return toast.error("Please fill all fields and select a city");
    }

    // Build full ISO datetime with seconds +05:30
    const datetimeISO = `${dateTime}:00+05:30`;

    const qs = new URLSearchParams({
      ayanamsa,
      coordinates: coords,
      datetime: encodeURIComponent(datetimeISO),
      la,
    }).toString();

    navigate(`/panchang-result?${qs}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-teal-900 flex items-center justify-center p-6">
      <Toaster position="top-center" />

      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8 space-y-6 w-full max-w-md "
      >
        <h1 className="text-3xl font-bold text-yellow-300 text-center">
          Detailed Panchang
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
              <option value="1">1 – Lahiri</option>
              <option value="3">3 – Raman</option>
              <option value="5">5 – KP</option>
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

        {/* Date & Time */}
        <div>
          <label className="block mb-1 flex items-center gap-1">
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

        {/* Location: Country / State / City */}
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

        {/* Coordinates (read‑only) */}
        <div className="relative">
          <label className="block mb-1 flex items-center gap-1">
            <Globe /> Coordinates
          </label>
          <input
            type="text"
            value={coords}
            readOnly
            className="w-full p-2 bg-white bg-opacity-20 rounded pr-10"
            placeholder="lat,lon"
          />
          <MapPin className="absolute right-2 top-[38px] text-yellow-300" />
        </div>

        <button
          type="submit"
          className="w-full bg-yellow-400 hover:bg-yellow-500 transition rounded py-3 flex items-center justify-center gap-2 font-semibold text-black"
        >
          <ArrowRight className="w-5 h-5" />
          Generate Panchang
        </button>
      </form>
    </div>
  );
}
