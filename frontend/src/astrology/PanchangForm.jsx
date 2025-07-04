// src/pages/PanchangForm.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { Globe, MapPin, Calendar, ArrowRight } from "lucide-react";
import { Country, State, City } from "country-state-city";

export default function PanchangForm() {
  const navigate = useNavigate();

  // Lahiri only
  const ayanamsa = "1";
  const [la, setLa] = useState("en");

  // Date & Time
  const [dateTime, setDateTime] = useState(""); // YYYY-MM-DDTHH:mm

  // Location fields
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [coords, setCoords] = useState("");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // load states on country change
  useEffect(() => {
    if (!countryCode) return;
    setStates(State.getStatesOfCountry(countryCode));
    setStateCode("");
    setCityName("");
    setCities([]);
    setCoords("");
  }, [countryCode]);

  // load cities on state change
  useEffect(() => {
    if (!stateCode) return;
    setCities(City.getCitiesOfState(countryCode, stateCode));
    setCityName("");
    setCoords("");
  }, [stateCode, countryCode]);

  // auto-fill coords on city select
  useEffect(() => {
    if (!cityName) return;
    const selected = cities.find(c => c.name === cityName);
    if (selected) {
      const lat = parseFloat(selected.latitude).toFixed(6);
      const lon = parseFloat(selected.longitude).toFixed(6);
      setCoords(`${lat},${lon}`);
    }
  }, [cityName, cities]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dateTime || !coords) {
      return toast.error("Please fill date/time and select a city");
    }

    // build full ISO string
    const datetimeISO = `${dateTime}:00+05:30`;

    // assemble query
    const qs = new URLSearchParams({
      ayanamsa,
      coordinates: coords,
      datetime: datetimeISO,
      la,
    }).toString();

    navigate(`/panchang-result?${qs}`);
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
            <option value="ta">தமிழ்</option>
            <option value="te">తెలుగు</option>
            <option value="ml">മലയാളം</option>
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
          className="w-full bg-yellow-400 hover:bg-yellow-500 transition rounded py-3 flex items-center justify-center gap-2 font-semibold text-black"
        >
          <ArrowRight className="w-5 h-5" />
          Generate Panchang
        </button>
      </form>
    </div>
  );
}
